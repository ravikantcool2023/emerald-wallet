import { BigAmount } from '@emeraldpay/bigamount';
import { BitcoinEntry, EntryId, UnsignedBitcoinTx } from '@emeraldpay/emerald-vault-core';
import { blockchainIdToCode, workflow } from '@emeraldwallet/core';
import { FeePrices, screen } from '@emeraldwallet/store';
import { Button, ButtonGroup, FormLabel, FormRow } from '@emeraldwallet/ui';
import {
  Box,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  Slider,
  Switch,
  createStyles,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import validate from 'bitcoin-address-validation';
import * as React from 'react';
import { connect } from 'react-redux';
import AmountField from '../CreateTx/AmountField';
import ToField from '../CreateTx/ToField/ToField';

const { ValidationResult } = workflow;

const useStyles = makeStyles(
  createStyles({
    feeHelp: {
      paddingLeft: 10,
      position: 'initial',
    },
    feeHelpBox: {
      width: 500,
      clear: 'left',
    },
    feeMarkLabel: {
      fontSize: '0.7em',
      opacity: 0.8,
    },
    feeSlider: {
      marginBottom: 10,
      paddingTop: 10,
      width: 300,
    },
    feeSliderBox: {
      float: 'left',
      width: 300,
    },
    feeTypeBox: {
      float: 'left',
      height: 40,
      width: 200,
    },
    inputField: {
      flexGrow: 5,
    },
    buttons: {
      display: 'flex',
      justifyContent: 'end',
      width: '100%',
    },
  }),
);

interface OwnProps {
  create: workflow.CreateBitcoinTx;
  entry: BitcoinEntry;
  source: EntryId;
  getFees(): Promise<FeePrices<number>>;
  onCreate(tx: UnsignedBitcoinTx, fee: BigAmount): void;
}

interface StateProps {
  onCancel?(): void;
}

const SetupTx: React.FC<OwnProps & StateProps> = ({ create, entry, getFees, onCancel, onCreate }) => {
  const styles = useStyles();

  const [initializing, setInitializing] = React.useState(true);

  const [amount, setAmount] = React.useState(create.requiredAmount);

  const [useStdFee, setUseStdFee] = React.useState(true);
  const [feePrice, setFeePrice] = React.useState(0);
  const [maximalFee, setMaximalFee] = React.useState(0);
  const [minimalFee, setMinimalFee] = React.useState(0);
  const [standardFee, setStandardFee] = React.useState(0);

  const getTotalFee = (price: number): BigAmount => create.estimateFees(price);

  const onSetAmount = (value: BigAmount): void => {
    create.requiredAmount = value;

    setAmount(value);
  };

  const onSetAmountMax = (): void => {
    create.target = workflow.TxTarget.SEND_ALL;

    setAmount(create.requiredAmount);
  };

  const onSetFeePrice = (value: number): void => {
    create.feePrice = value;

    setAmount(create.requiredAmount);
    setFeePrice(value);
  };

  const onSetTo = (value: string | undefined): void => {
    create.toAddress = value == null || !validate(value) ? '' : value;
  };

  React.useEffect(
    () => {
      getFees().then(({ avgLast, avgTail5, avgMiddle }) => {
        setMinimalFee(avgLast);
        setStandardFee(avgTail5);
        setMaximalFee(avgMiddle);

        onSetFeePrice(avgTail5);

        setInitializing(false);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const totalFee = getTotalFee(feePrice);
  const validTx = !initializing && create.validate() === ValidationResult.OK;

  return (
    <>
      <FormRow>
        <ToField blockchain={blockchainIdToCode(entry.blockchain)} to={create.toAddress} onChange={onSetTo} />
      </FormRow>
      <FormRow>
        <AmountField
          amount={amount}
          maxDisabled={initializing}
          units={create.requiredAmount.units}
          onChangeAmount={onSetAmount}
          onMaxClicked={onSetAmountMax}
        />
      </FormRow>
      <FormRow>
        <FormLabel top>Fee</FormLabel>
        <Box className={styles.inputField}>
          <Box className={styles.feeTypeBox}>
            <FormControlLabel
              control={
                <Switch
                  checked={useStdFee}
                  disabled={initializing}
                  onChange={(event) => {
                    const checked = event.target.checked;

                    if (checked) {
                      onSetFeePrice(standardFee);
                    }

                    setUseStdFee(checked);
                  }}
                  name="checkedB"
                  color="primary"
                />
              }
              label={useStdFee ? 'Standard Fee' : 'Custom Fee'}
            />
          </Box>
          {!useStdFee && (
            <Box className={styles.feeSliderBox}>
              <Slider
                className={styles.feeSlider}
                classes={{ markLabel: styles.feeMarkLabel }}
                defaultValue={standardFee}
                getAriaValueText={(value) => getTotalFee(value).toString()}
                aria-labelledby="discrete-slider"
                valueLabelDisplay="auto"
                step={1}
                marks={[
                  { value: minimalFee, label: 'Slow' },
                  { value: maximalFee, label: 'Urgent' },
                ]}
                min={minimalFee}
                max={maximalFee}
                onChange={(event, value) => onSetFeePrice(value as number)}
                valueLabelFormat={(value) => (value / 1024).toFixed(2)}
              />
            </Box>
          )}
          <Box className={styles.feeHelpBox}>
            <FormHelperText className={styles.feeHelp}>{totalFee.toString()}</FormHelperText>
          </Box>
        </Box>
      </FormRow>
      <FormRow last>
        <FormLabel />
        <ButtonGroup classes={{ container: styles.buttons }}>
          {initializing && (
            <Button disabled icon={<CircularProgress size={16} />} label="Checking the network" variant="text" />
          )}
          <Button label="Cancel" onClick={onCancel} />
          <Button
            primary
            disabled={!validTx}
            label="Create Transaction"
            onClick={() => onCreate(create.create(), totalFee)}
          />
        </ButtonGroup>
      </FormRow>
    </>
  );
};

export default connect(
  null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dispatch: any) => ({
    onCancel: () => dispatch(screen.actions.gotoWalletsScreen()),
  }),
)(SetupTx);

import { BlockchainCode, IBlockchain, TokenRegistry } from '@emeraldwallet/core';
import { IState } from '@emeraldwallet/store';
import { CoinAvatar } from '@emeraldwallet/ui';
import { FormControlLabel, Grid, Switch, Typography, createStyles } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as React from 'react';
import { connect } from 'react-redux';

const useStyles = makeStyles(
  createStyles({
    iconBox: {
      paddingTop: '8px',
      paddingLeft: '32px',
    },
    row: {
      marginTop: '16px',
    },
    descriptionEnabled: {},
    descriptionDisabled: {
      opacity: '0.5',
    },
  }),
);

interface StateProps {
  tokenRegistry: TokenRegistry;
}

interface OwnProps {
  blockchains: IBlockchain[];
  enabled: BlockchainCode[];
  multiple?: boolean;
  onChange(value: BlockchainCode[]): void;
}

const SelectCoins: React.FC<OwnProps & StateProps> = ({ blockchains, enabled, multiple, tokenRegistry, onChange }) => {
  const styles = useStyles();

  const [justEnabled, setJustEnabled] = React.useState<BlockchainCode[]>([]);

  function isJustEnabled(code: BlockchainCode): boolean {
    return justEnabled.indexOf(code) >= 0;
  }

  function toggleBlockchain(code: BlockchainCode): void {
    let copy: BlockchainCode[] = [];

    if (!multiple) {
      copy.push(code);
    } else {
      copy = copy.concat(justEnabled);

      if (isJustEnabled(code)) {
        copy = justEnabled.filter((it) => it != code);
      } else {
        copy.push(code);
      }
    }

    setJustEnabled(copy);
    onChange(copy);
  }

  return (
    <Grid container={true}>
      {blockchains.map((blockchain) => {
        const blockchainWasEnabled = enabled.indexOf(blockchain.params.code) >= 0;
        const blockchainNowEnabled = blockchainWasEnabled || isJustEnabled(blockchain.params.code);

        const tokens = tokenRegistry
          .getStablecoins(blockchain.params.code)
          .map(({ name, symbol }) => `${name} (${symbol})`)
          .join(', ');

        return (
          <Grid item={true} xs={12} key={blockchain.params.code} className={styles.row}>
            <Grid container={true}>
              <Grid item={true} xs={1} className={styles.iconBox}>
                <CoinAvatar blockchain={blockchain.params.code} size="default" />
              </Grid>
              <Grid
                item={true}
                xs={8}
                className={blockchainNowEnabled ? styles.descriptionEnabled : styles.descriptionDisabled}
              >
                <Typography variant={'subtitle1'}>{blockchain.getTitle()}</Typography>
                {tokens.length > 0 && <Typography variant={'body2'}>Cryptocurrencies: {tokens}</Typography>}
              </Grid>
              <Grid item={true} xs={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={blockchainNowEnabled}
                      onChange={() => toggleBlockchain(blockchain.params.code)}
                      disabled={blockchainWasEnabled} // deny to remove existing chains for now
                      name="checkedB"
                      color="primary"
                    />
                  }
                  label={blockchainNowEnabled ? 'Enabled' : 'Disabled'}
                />
              </Grid>
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default connect<StateProps, unknown, unknown, IState>((state) => ({
  tokenRegistry: new TokenRegistry(state.application.tokens),
}))(SelectCoins);

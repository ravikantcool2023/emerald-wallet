import {IState, screen} from '@emeraldwallet/store';
import {Button, Card, CardActions, CardContent, CardHeader, Step, StepLabel, Stepper} from '@material-ui/core';
import * as React from 'react';
import {Dispatch} from 'react';
import {connect} from 'react-redux';
import * as vault from "@emeraldpay/emerald-vault-core";
import SelectKeySource from "./SelectKeySource";
import {defaultResult, isSeedSelected, Result, SeedResult, SeedSelected, TWalletOptions} from "./flow/types";
import WalletOptions from "./WalletOptions";
import Finish from "./Finish";
import SelectCoins from "../create-account/SelectCoins";
import {BlockchainCode, IBlockchain} from "@emeraldwallet/core";
import SelectHDPath from "../create-account/SelectHDPath";
import {SourceSeed} from "@emeraldwallet/store/lib/hdpath-preview/types";
import UnlockSeed from "../create-account/UnlockSeed";
import {CreateWalletFlow, STEP_CODE} from "./flow/createWalletFlow";

type Props = {}
type Actions = {
  onOpen: (walletId: string) => void,
}

/**
 * Multistep wizard to create a new Wallet. The wallet can be created from an existing or new seed, private key, or just
 * empty without any account initially.
 */
export const CreateWizard = ((props: Props & Actions & OwnProps) => {
  function create(result: Result) {
    props.onCreate(result)
      .then((id) => {
        setWalletId(id);
      })
      .catch(props.onError);
  }

  // const [result, setResult] = React.useState(defaultResult());
  const [step, setStep] = React.useState(new CreateWalletFlow(create));
  // const [keySource, setKeySource] = React.useState('empty' as SeedResult);
  const [walletId, setWalletId] = React.useState('');
  // const [password, setPassword] = React.useState('');

  const page = step.getCurrentStep();
  const applyWithState = function <T>(fn: (value: T) => CreateWalletFlow): (value: T) => void {
    return (x) => {
      const next = fn.call(step, x);
      setStep(next);
    }
  }
  let activeStepIndex = page.index;
  let activeStepPage = null;

  if (page.code == STEP_CODE.KEY_SOURCE) {
    activeStepPage = <SelectKeySource seeds={props.seeds} onSelect={applyWithState(step.applySource)}/>
  } else if (page.code == STEP_CODE.OPTIONS) {
    activeStepPage = <WalletOptions onChange={applyWithState(step.applyOptions)}/>
  } else if (page.code == STEP_CODE.SELECT_BLOCKCHAIN) {
    activeStepPage =
      <SelectCoins blockchains={props.blockchains} enabled={[]} onChange={applyWithState(step.applyBlockchains)}/>;
  } else if (page.code == STEP_CODE.UNLOCK_SEED) {
    activeStepPage = <UnlockSeed onUnlock={applyWithState(step.applySeedPassword)}/>
  } else if (page.code == STEP_CODE.SELECT_HD_ACCOUNT) {
    const seed: SourceSeed = {
      type: "seed-ref",
      seedId: (step.getResult().type as SeedSelected).id,
      password: step.getResult().seedPassword
    }
    activeStepPage = <SelectHDPath blockchains={step.getResult().blockchains}
                                   seed={seed}
                                   onChange={applyWithState(step.applyHDAccount)}/>
  } else if (page.code == STEP_CODE.CREATED) {
    activeStepPage = <Finish id={walletId} onOpen={() => props.onOpen(walletId)}/>
  }

  const stepper = <Stepper activeStep={activeStepIndex}>
    {step.getSteps().map((it) => (
      <Step key={it.code}>
        <StepLabel>{it.title}</StepLabel>
      </Step>
    ))}
  </Stepper>

  return (
    <Card>
      <CardHeader action={stepper}/>
      <CardContent>{activeStepPage}</CardContent>
      <CardActions>
        <Button disabled={page.code == STEP_CODE.CREATED}
                onClick={props.onCancel}>
          Cancel
        </Button>
        <Button disabled={!step.canGoNext()}
                onClick={() => setStep(step.applyNext())}
                color={"primary"}
                variant="contained">
          Next
        </Button>
      </CardActions>
    </Card>
  );
});

type OwnProps = {
  seeds: vault.SeedDescription[]
  onCreate: (value: Result) => Promise<string>,
  onError: (err: any) => void,
  onCancel: () => void,
  blockchains: IBlockchain[]
}

export default connect(
  (state: IState, ownProps: OwnProps): Props => {
    return {}
  },
  (dispatch: Dispatch<any>, ownProps: OwnProps): Actions => {
    return {
      onOpen: (walletId: string) => {
        dispatch(screen.actions.gotoScreen("wallet", walletId))
      }
    }
  }
)((CreateWizard));

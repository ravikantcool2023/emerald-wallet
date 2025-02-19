import { Uuid } from '@emeraldpay/emerald-vault-core';
import { accounts } from '@emeraldwallet/store';
import { Button, PasswordInput } from '@emeraldwallet/ui';
import { Box, Grid, Typography, createStyles, makeStyles } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import * as React from 'react';
import { connect } from 'react-redux';

const useStyles = makeStyles(
  createStyles({
    alert: {
      marginTop: 20,
    },
  }),
);

interface OwnProps {
  seedId: Uuid;
  onUnlock(password: string): void;
}

interface DispatchProps {
  verifyPassword(password: string): Promise<boolean>;
}

const Component: React.FC<OwnProps & DispatchProps> = ({ seedId, onUnlock, verifyPassword }) => {
  const styles = useStyles();

  const [password, setPassword] = React.useState('');

  const [invalid, setInvalid] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);

  const onVerify = (): void => {
    setVerifying(true);

    verifyPassword(password).then((valid) => {
      if (valid) {
        onUnlock(password);
      }

      setInvalid(!valid);
      setVerifying(false);
    });
  };

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="h5">Password to unlock seed</Typography>
        <Typography>Please provide password to unlock seed {seedId}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Box mt={2}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <PasswordInput
                disabled={verifying}
                initialValue={password}
                minLength={1}
                showPlaceholder={false}
                onChange={setPassword}
              />
            </Grid>
            <Grid item xs="auto">
              <Button primary disabled={verifying} label="Unlock" onClick={onVerify} />
            </Grid>
          </Grid>
        </Box>
      </Grid>
      {invalid && (
        <Grid item xs={12}>
          <Alert className={styles.alert} severity="error">
            Invalid password
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

export default connect<unknown, DispatchProps, OwnProps>(
  null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dispatch: any, { seedId }): DispatchProps => ({
    verifyPassword(password) {
      return new Promise((resolve) => {
        dispatch(accounts.actions.unlockSeed(seedId, password, resolve));
      });
    },
  }),
)(Component);

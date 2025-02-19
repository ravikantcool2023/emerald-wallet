import { BlockchainCode } from '@emeraldwallet/core';
import { Typography, createStyles } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as React from 'react';
import { CurrencyBtc, CurrencyEtc, CurrencyEth } from '../../../icons';

const useStyles = makeStyles(
  createStyles({
    defaultSize: {
      fill: 'none',
    },
    largeSize: {
      fill: 'none',
      fontSize: '1.2em',
    },
    smallSize: {
      fill: 'none',
      fontSize: '0.5em',
    },
    testnet: {
      fontSize: '0.4em',
      color: '#f0f0f0',
    },
  }),
);

interface OwnProps {
  blockchain: BlockchainCode;
  size?: 'small' | 'large' | 'default';
}

const CoinIcon: React.FC<OwnProps> = ({ blockchain, size }) => {
  const styles = useStyles();

  const iconSize = styles[`${size ?? 'default'}Size`];

  switch (blockchain) {
    // Mainnet
    case BlockchainCode.BTC:
      return <CurrencyBtc className={iconSize} />;
    case BlockchainCode.ETC:
      return <CurrencyEtc className={iconSize} />;
    case BlockchainCode.ETH:
      return <CurrencyEth className={iconSize} />;
    // Testnet
    case BlockchainCode.Goerli:
      return <Typography className={styles.testnet}>Goerli</Typography>;
    case BlockchainCode.TestBTC:
      return <Typography className={styles.testnet}>TBTC</Typography>;
    // Other
    default:
      return null;
  }
};

export default CoinIcon;

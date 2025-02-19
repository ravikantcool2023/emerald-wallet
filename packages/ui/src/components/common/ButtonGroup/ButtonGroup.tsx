/*
Copyright 2019 ETCDEV GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { withStyles } from '@material-ui/core';
import * as React from 'react';
import styles from './styles';

interface Classes {
  container: string;
  firstItem: string;
  restItems: string;
}

interface OwnProps {
  children?: React.ReactNode | React.ReactNode[];
  classes?: Classes;
  style?: React.CSSProperties;
}

export const ButtonGroup: React.FC<OwnProps> = ({ classes, children, style }) => {
  if (children == null) {
    return null;
  }

  return (
    <div className={classes?.container} style={style}>
      {Array.isArray(children) ? (
        children
          .filter((button) => button != null && button !== false)
          .map((button, index) => (
            <div
              key={button.key ?? `group-button[${button.props.label ?? index}]`}
              className={index === 0 ? classes?.firstItem : classes?.restItems}
            >
              {button}
            </div>
          ))
      ) : (
        <div className={classes?.firstItem}>{children}</div>
      )}
    </div>
  );
};

export default withStyles(styles)(ButtonGroup);

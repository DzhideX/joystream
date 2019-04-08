// Copyright 2017-2019 @polkadot/ui-app authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { I18nProps } from './types';

import React from 'react';
import { AccountId, AccountIndex, Address, Balance } from '@polkadot/types';
import { Nonce } from '@polkadot/ui-reactive';
import { withCalls } from '@polkadot/ui-api';

import { classes, toShortAddress } from './util';
import BalanceDisplay from './Balance';
import IdentityIcon from './IdentityIcon';
import translate from './translate';

export type Props = I18nProps & {
  accounts_idAndIndex?: [AccountId?, AccountIndex?],
  balance?: Balance | Array<Balance>,
  children?: React.ReactNode,
  extraInfo?: React.ReactNode,
  name?: string,
  value: AccountId | AccountIndex | Address | string | null,
  showFaucet?: boolean,
  withBalance?: boolean,
  withIndex?: boolean,
  identIconSize?: number,
  isShort?: boolean,
  session_validators?: Array<AccountId>,
  withCopy?: boolean,
  withIcon?: boolean,
  withNonce?: boolean
};

const DEFAULT_ADDR = '5'.padEnd(16, 'x');

class AddressSummary extends React.PureComponent<Props> {
  render () {
    const { accounts_idAndIndex = [], className, style } = this.props;
    const [accountId, accountIndex] = accounts_idAndIndex;
    const isValid = accountId || accountIndex;

    return (
      <div
        className={classes('ui--AddressSummary', !isValid && 'invalid', className)}
        style={style}
      >
        <div className='ui--AddressSummary-base'>
          {this.renderIcon()}
          {this.renderAccountId()}
          {this.renderAccountIndex()}
          {this.renderBalance()}
          {this.renderExtra()}
          {this.renderNonce()}
          {this.renderFaucet()}
        </div>
        {this.renderChildren()}
      </div>
    );
  }

  protected renderAddress () {
    const { name, isShort = true, value } = this.props;

    if (!value) {
      return null;
    }

    const address = value.toString();

    return (
      <div className='ui--AddressSummary-data'>
        <div className='ui--AddressSummary-name'>
          {name}
        </div>
        <div className='ui--AddressSummary-accountId'>
          {
            isShort
              ? toShortAddress(address)
              : value
          }
        </div>
      </div>
    );
  }

  protected renderAccountId () {
    const { accounts_idAndIndex = [], name, isShort = true, value } = this.props;
    const [_accountId, accountIndex] = accounts_idAndIndex;
    const accountId = _accountId || value;

    if (!accountId && accountIndex) {
      return null;
    }

    const address = accountId
      ? accountId.toString()
      : DEFAULT_ADDR;

    return (
      <div className='ui--AddressSummary-data'>
        <div className='ui--AddressSummary-name'>
          {name}
        </div>
        <div className='ui--AddressSummary-accountId'>
          {
            isShort
              ? toShortAddress(address)
              : address
          }
        </div>
      </div>
    );
  }

  protected renderAccountIndex () {
    const { accounts_idAndIndex = [] } = this.props;
    const [, accountIndex] = accounts_idAndIndex;

    if (!accountIndex) {
      return null;
    }

    const address = accountIndex.toString();

    return (
      <div className='ui--AddressSummary-data'>
        <div className='ui--AddressSummary-name'></div>
        <div className='ui--AddressSummary-accountIndex'>
          {address}
        </div>
      </div>
    );
  }

  protected renderBalance () {
    const { accounts_idAndIndex = [], balance, t, value, withBalance = true } = this.props;
    const [_accountId] = accounts_idAndIndex;
    const accountId = _accountId || value;

    if (!withBalance || !accountId) {
      return null;
    }

    return (
      <BalanceDisplay
        balance={balance}
        className='ui--AddressSummary-balance'
        label={t('balance ')}
        value={accountId}
      />
    );
  }

  protected renderExtra () {
    const { extraInfo } = this.props;

    if (!extraInfo) {
      return null;
    }

    return (
      <div className='ui--AddressSummary-extra'>
        {extraInfo}
      </div>
    );
  }

  protected renderIcon (className: string = 'ui--AddressSummary-icon', size?: number) {
    const { accounts_idAndIndex = [], identIconSize = 96, value, withIcon = true } = this.props;

    if (!withIcon) {
      return null;
    }

    const [_accountId] = accounts_idAndIndex;
    const accountId = (_accountId || value || '').toString();

    return (
      <IdentityIcon
        className={className}
        size={size || identIconSize}
        value={accountId || DEFAULT_ADDR}
      />
    );
  }

  protected renderFaucet () {
    const { showFaucet = false, value } = this.props;
    const url = 'https://sparta.joystream.org/faucet' + (value ? `?address=${value}` : '');
    return showFaucet ? <a href={url} target='_blank'>Get free tokens</a> : null;
  }

  protected renderNonce () {
    const { accounts_idAndIndex = [], t, value, withNonce = true } = this.props;
    const [_accountId] = accounts_idAndIndex;
    const accountId = _accountId || value;

    if (!withNonce || !accountId) {
      return null;
    }

    return (
      <Nonce
        className='ui--AddressSummary-nonce'
        params={accountId.toString()}
      >
        {t(' transactions')}
      </Nonce>
    );
  }

  protected renderChildren () {
    const { children } = this.props;

    if (!children || (Array.isArray(children) && children.length === 0)) {
      return null;
    }

    return (
      <div className='ui--AddressSummary-children'>
        {children}
      </div>
    );
  }
}

export {
  DEFAULT_ADDR,
  AddressSummary
};

export default translate(
  withCalls<Props>(
    ['derive.accounts.idAndIndex', { paramName: 'value' }]
  )(AddressSummary)
);

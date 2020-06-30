import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { apiModuleByGroup } from '../../Api';
import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import { positiveInt } from '../../validators/common';
import chalk from 'chalk';
import ExitCodes from '../../ExitCodes';

export default class WorkingGroupsIncreaseStake extends WorkingGroupsCommandBase {
    static description =
        'Increases role (lead/worker) stake. Requires active role account to be selected.';
    static flags = {
        ...WorkingGroupsCommandBase.flags,
    };

    async run() {
        const account = await this.getRequiredSelectedAccount();
        // Worker-only gate
        const worker = await this.getRequiredWorker();

        if (!worker.stake) {
            this.error('Cannot increase stake. No associated role stake profile found!', { exit: ExitCodes.InvalidInput });
        }

        this.log(chalk.white('Current stake: ', formatBalance(worker.stake)));
        const balance = await this.promptForParam('Balance', 'amount', undefined, positiveInt()) as Balance;

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'increaseStake',
            [
                worker.workerId,
                balance
            ]
        );

        this.log(chalk.green(
            `Worker ${chalk.white(worker.workerId.toNumber())} stake has been increased by ${chalk.white(formatBalance(balance))}`
        ));
    }
}

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import ISO6391 from 'iso-639-1';

import { AccountId } from "@polkadot/types/interfaces";
import { Option } from '@polkadot/types/codec';
import { Content } from '../../../generated/types'
import {
  readProtobuf,
  readProtobufWithAssets,
  convertContentActorToOwner,
} from './utils'

import {
  DataObject,
} from 'query-node/src/modules/data-object/data-object.model'
import {
  inconsistentState,
  logger,
} from '../common'

// primary entities
import { Channel } from 'query-node/src/modules/channel/channel.model'
import { ChannelCategory } from 'query-node/src/modules/channel-category/channel-category.model'

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCreated(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {channelId, channelCreationParameters, contentActor} = new Content.ChannelCreatedEvent(event).data

  // read metadata
  const protobufContent = await readProtobufWithAssets(
    new Channel(),
    {
      metadata: channelCreationParameters.meta,
      db,
      blockNumber: event.blockNumber,
      assets: channelCreationParameters.assets,
      contentOwner: convertContentActorToOwner(contentActor, channelId.toBn()),
    }
  )

  // create entity
  const channel = new Channel({
    id: channelId.toString(),
    isCensored: false,
    videos: [],
    createdInBlock: event.blockNumber,
    ...protobufContent
  })

  // save entity
  await db.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been created', {id: channel.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {
    channelId,
    channelUpdateParameters,
    contentActor,
  } = new Content.ChannelUpdatedEvent(event).data

  // load channel
  const channel = await db.get(Channel, { where: { id: channelId } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel update requested', channelId)
  }

  // prepare changed metadata
  const newMetadata = channelUpdateParameters.new_meta.isSome && channelUpdateParameters.new_meta.unwrapOr(null)

  //  update metadata if it was changed
  if (newMetadata) {
    const protobufContent = await readProtobufWithAssets(
      new Channel(),
      {
        metadata: newMetadata,
        db,
        blockNumber: event.blockNumber,
        assets: channelUpdateParameters.assets.unwrapOr([]),
        contentOwner: convertContentActorToOwner(contentActor, channelId),
      }
    )

    // update all fields read from protobuf
    for (let [key, value] of Object(protobufContent).entries()) {
      channel[key] = value
    }
  }

  // prepare changed reward account
  const newRewardAccount = channelUpdateParameters.reward_account.isSome && channelUpdateParameters.reward_account.unwrapOr(null)

  // reward account change happened?
  if (newRewardAccount) {
    // this will change the `channel`!
    handleChannelRewardAccountChange(channel, newRewardAccount)
  }

  // save channel
  await db.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been updated', {id: channel.id})
}

export async function content_ChannelAssetsRemoved(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {contentId: contentIds} = new Content.ChannelAssetsRemovedEvent(event).data

  // load channel
  const assets = await db.getMany(DataObject, { where: { id: contentIds } })

  // delete assets
  for (const asset of assets) {
    await db.remove<DataObject>(asset)
  }

  // emit log event
  logger.info('Channel assets have been removed', {ids: contentIds})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelId} = new Content.ChannelCensoredEvent(event).data

  // load event
  const channel = await db.get(Channel, { where: { id: channelId } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel censoring requested', channelId)
  }

  // update channel
  channel.isCensored = true;

  // save channel
  await db.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been censored', {id: channelId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelId} = new Content.ChannelUncensoredEvent(event).data

  // load event
  const channel = await db.get(Channel, { where: { id: channelId } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel uncensoring requested', channelId)
  }

  // update channel
  channel.isCensored = false;

  // save channel
  await db.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been uncensored', {id: channel.id})
}

/////////////////// ChannelCategory ////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelCategoryCreationParameters, channelCategoryId} = new Content.ChannelCategoryCreatedEvent(event).data
  const {actor: contentActor} = new Content.CreateChannelCategoryCall(event).args

  // read metadata
  const protobufContent = await readProtobuf(
    new ChannelCategory(),
    {
      metadata: channelCategoryCreationParameters.meta,
      db,
      blockNumber: event.blockNumber,
    }
  )

  // create new channel category
  const channelCategory = new ChannelCategory({
    id: channelCategoryId.toString(),
    channels: [],
    createdInBlock: event.blockNumber,
    ...protobufContent
  })

  // save channel
  await db.save<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been created', {id: channelCategory.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {
    channelCategoryId,
    channelCategoryUpdateParameters,
    contentActor,
  } = new Content.ChannelCategoryUpdatedEvent(event).data

  // load channel category
  const channelCategory = await db.get(ChannelCategory, { where: { id: channelCategoryId } })

  // ensure channel exists
  if (!channelCategory) {
    return inconsistentState('Non-existing channel category update requested', channelCategoryId)
  }

  // read metadata
  const protobufContent = await readProtobuf(
    new ChannelCategory(),
    {
      metadata: channelCategoryUpdateParameters.new_meta,
      db,
      blockNumber: event.blockNumber,
    }
  )

  // update all fields read from protobuf
  for (let [key, value] of Object(protobufContent).entries()) {
    channelCategory[key] = value
  }

  // save channel category
  await db.save<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been updated', {id: channelCategory.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelCategoryId} = new Content.ChannelCategoryDeletedEvent(event).data

  // load channel category
  const channelCategory = await db.get(ChannelCategory, { where: { id: channelCategoryId } })

  // ensure channel category exists
  if (!channelCategory) {
    return inconsistentState('Non-existing channel category deletion requested', channelCategoryId)
  }

  // delete channel category
  await db.remove<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been deleted', {id: channelCategory.id})
}

/////////////////// Helpers ////////////////////////////////////////////////////

function handleChannelRewardAccountChange(
  channel: Channel, // will be modified inside of the function!
  reward_account: Option<AccountId>
) {
  const rewardAccount = reward_account.isSome && reward_account.unwrapOr(null)

  // new different reward account set?
  if (rewardAccount) {
    channel.rewardAccount = rewardAccount.toString()
    return
  }

  // reward account removed

  channel.rewardAccount = undefined // plan deletion (will have effect when saved to db)
}

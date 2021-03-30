import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import { CuratorGroup } from 'query-node/src/modules/curator-group/curator-group.model'
import { Content } from '../../../generated/types'

import {
  inconsistentState,
  logger,
} from '../common'

export async function content_CuratorGroupCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId} = new Content.CuratorGroupCreatedEvent(event).data

  // create new curator group
  const curatorGroup = new CuratorGroup({
    id: curatorGroupId.toString(),
    curatorIds: [],
    isActive: false, // runtime creates inactive curator groups by default
  })

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator group has been created', {id: curatorGroupId.id})
}

export async function content_CuratorGroupStatusSet(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, bool: isActive} = new Content.CuratorGroupStatusSetEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Non-existing curator group status set requested', curatorGroupId)
  }

  // update curator group
  curatorGroup.isActive = isActive.isTrue

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator group status has been set', {id: curatorGroupId.id, isActive})
}

export async function content_CuratorAdded(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, curatorId} = new Content.CuratorAddedEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Curator add to non-existing curator group requested', curatorGroupId)
  }

  // update curator group
  curatorGroup.curatorIds.push(curatorId)

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator has been added to curator group', {id: curatorGroupId.id, curatorId})
}

export async function content_CuratorRemoved(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, curatorId} = new Content.CuratorAddedEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Non-existing curator group removal requested', curatorGroupId)
  }

  const curatorIndex = curatorGroup.curatorIds.indexOf(curatorId)

  // ensure curator group exists
  if (curatorIndex < 0) {
    return inconsistentState('Non-associated curator removal from curator group requested', curatorId)
  }

  // update curator group
  curatorGroup.curatorIds.splice(curatorIndex, 1)

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator has been removed from curator group', {id: curatorGroupId.id, curatorId})
}

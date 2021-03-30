import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import {
  Content,
} from '../../../generated/types'

import {
  inconsistentState,
  logger,
  prepareBlock,
} from '../common'

import { readProtobuf } from './utils'

// primary entities
import { Video } from 'query-node/src/modules/video/video.model'
import { VideoCategory } from 'query-node/src/modules/video-category/video-category.model'

// secondary entities
import { License } from 'query-node/src/modules/license/license.model'

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId, videoCategoryCreationParameters} = new Content.VideoCategoryCreatedEvent(event).data

  // read metadata
  const protobufContent = readProtobuf(
    new VideoCategory(),
    videoCategoryCreationParameters.meta,
    [],
    db,
    event
  )

  // create new video category
  const videoCategory = new VideoCategory({
    id: videoCategoryId.toString(), // ChannelId
    isCensored: false,
    videos: [],
    happenedIn: await prepareBlock(db, event),
    ...Object(protobufContent)
  })

  // save video category
  await db.save<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been created', {id: videoCategoryId.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId, videoCategoryUpdateParameters} = new Content.VideoCategoryUpdatedEvent(event).data

  // load video category
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState('Non-existing video category update requested', videoCategoryId)
  }

  // read metadata
  const protobufContent = await readProtobuf(
    new VideoCategory(),
    videoCategoryUpdateParameters.new_meta,
    [],
    db,
    event,
  )

  // update all fields read from protobuf
  for (let [key, value] of Object(protobufContent).entries()) {
    videoCategory[key] = value
  }

  // save video category
  await db.save<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been updated', {id: videoCategoryId.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId} = new Content.VideoCategoryDeletedEvent(event).data

  // load video category
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState('Non-existing video category deletion requested', videoCategoryId)
  }

  // remove video category
  await db.remove<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been deleted', {id: videoCategoryId.id})
}

/////////////////// Video //////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelId, videoId, videoCreationParameters} = new Content.VideoCreatedEvent(event).data

  // read metadata
  const protobufContent = await readProtobuf(
    new Video(),
    videoCreationParameters.meta,
    videoCreationParameters.assets,
    db,
    event,
  )

  // create new video
  const video = new Video({
    id: videoId,
    isCensored: false,
    channel: channelId,
    happenedIn: await prepareBlock(db, event),
    ...Object(protobufContent)
  })

  // save video
  await db.save<Video>(video)

  // emit log event
  logger.info('Video has been created', {id: videoId.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId, videoUpdateParameters} = new Content.VideoUpdatedEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video update requested', videoId)
  }

  // prepare changed metadata
  const newMetadata = videoUpdateParameters.new_meta.isSome && videoUpdateParameters.new_meta.unwrapOr(null)

  // update metadata if it was changed
  if (newMetadata) {
    const protobufContent = await readProtobuf(
      new Video(),
      newMetadata,
      videoUpdateParameters.assets.unwrapOr([]),
      db,
      event,
    )

    // remember original license
    const originalLicense = video.license

    // update all fields read from protobuf
    for (let [key, value] of Object(protobufContent).entries()) {
      video[key] = value
    }

    // license has changed - delete old license
    if (originalLicense && video.license != originalLicense) {
      await db.remove<License>(originalLicense)
    }
  }

  // TODO: handle situation when only assets changed

  // save video
  await db.save<Video>(video)

  // emit log event
  logger.info('Video has been updated', {id: videoId.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoDeletedEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video deletion requested', videoId)
  }

  // remove video
  await db.remove<Video>(video)

  // emit log event
  logger.info('Video has been deleted', {id: videoId.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoCensoredEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video censoring requested', videoId)
  }

  // update video
  video.isCensored = true;

  // save video
  await db.save<Video>(video)

  // emit log event
  logger.info('Video has been censored', {id: videoId.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoUncensoredEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video uncensoring requested', videoId)
  }

  // update video
  video.isCensored = false;

  // save video
  await db.save<Video>(video)

  // emit log event
  logger.info('Video has been uncensored', {id: videoId.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_FeaturedVideosSet(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId: videoIds} = new Content.FeaturedVideosSetEvent(event).data

  // load old featured videos
  const existingFeaturedVideos = await db.getMany(Video, { where: { isFeatured: true } })

  // comparsion utility
  const isSame = (videoIdA: string) => (videoIdB: string) => videoIdA == videoIdB

  // calculate diff sets
  const toRemove = existingFeaturedVideos.filter(existingFV =>
    !videoIds
      .map(item => item.toHex())
      .some(isSame(existingFV.id))
  )
  const toAdd = videoIds.filter(video =>
    !existingFeaturedVideos
      .map(item => item.id)
      .some(isSame(video.toHex()))
  )

  // mark previously featured videos as not-featured
  for (let video of toRemove) {
    video.isFeatured = false;

    await db.save<Video>(video)
  }

  // escape if no featured video needs to be added
  if (!toAdd) {
    // emit log event
    logger.info('Featured videos unchanged')

    return
  }

  // read videos previously not-featured videos that are meant to be featured
  const videosToAdd = await db.getMany(Video, { where: { id: [toAdd] } })

  if (videosToAdd.length != toAdd.length) {
    return inconsistentState('At least one non-existing video featuring requested', toAdd)
  }

  // mark previously not-featured videos as featured
  for (let video of videosToAdd) {
    video.isFeatured = true;

    await db.save<Video>(video)
  }

  // emit log event
  logger.info('New featured videos have been set', {videoIds})
}

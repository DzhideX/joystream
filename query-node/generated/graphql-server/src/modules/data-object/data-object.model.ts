import { BaseModel, IntField, NumericField, Model, OneToMany, EnumField, StringField } from 'warthog';

import BN from 'bn.js';

import { Column } from 'typeorm';
import { Field } from 'type-graphql';
import { WarthogField } from 'warthog';

import { DataObjectOwner } from '../variants/variants.model';

import { Channel } from '../channel/channel.model';
import { Video } from '../video/video.model';

import { LiaisonJudgement } from '../enums/enums';
export { LiaisonJudgement };

@Model({ api: { description: `Manages content ids, type and storage provider decision about it` } })
export class DataObject extends BaseModel {
  @Column('jsonb')
  @WarthogField('json')
  @Field(type => DataObjectOwner, {
    description: `Content owner`
  })
  owner!: typeof DataObjectOwner;

  @IntField({
    description: `Content added at`
  })
  addedAt!: number;

  @IntField({
    description: `Content type id`
  })
  typeId!: number;

  @NumericField({
    description: `Content size in bytes`,

    transformer: {
      to: (entityValue: BN) => (entityValue !== undefined ? entityValue.toString(10) : null),
      from: (dbValue: string) =>
        dbValue !== undefined && dbValue !== null && dbValue.length > 0 ? new BN(dbValue, 10) : undefined
    }
  })
  size!: BN;

  @NumericField({
    description: `Storage provider id of the liaison`,

    transformer: {
      to: (entityValue: BN) => (entityValue !== undefined ? entityValue.toString(10) : null),
      from: (dbValue: string) =>
        dbValue !== undefined && dbValue !== null && dbValue.length > 0 ? new BN(dbValue, 10) : undefined
    }
  })
  liaisonId!: BN;

  @EnumField('LiaisonJudgement', LiaisonJudgement, {
    description: `Storage provider as liaison judgment`
  })
  liaisonJudgement!: LiaisonJudgement;

  @StringField({
    description: `IPFS content id`
  })
  ipfsContentId!: string;

  @StringField({
    description: `Joystream runtime content`
  })
  joystreamContentId!: string;

  @OneToMany(
    () => Channel,
    (param: Channel) => param.coverPhotoDataObject,
    { nullable: true }
  )
  channelcoverPhotoDataObject?: Channel[];

  @OneToMany(
    () => Channel,
    (param: Channel) => param.avatarDataObject,
    { nullable: true }
  )
  channelavatarDataObject?: Channel[];

  @OneToMany(
    () => Video,
    (param: Video) => param.thumbnailDataObject,
    { nullable: true }
  )
  videothumbnailDataObject?: Video[];

  @OneToMany(
    () => Video,
    (param: Video) => param.mediaDataObject,
    { nullable: true }
  )
  videomediaDataObject?: Video[];

  constructor(init?: Partial<DataObject>) {
    super();
    Object.assign(this, init);
  }
}

import { BaseModel, IntField, NumericField, DateTimeField, Model, OneToMany, EnumField, StringField } from 'warthog';

import BN from 'bn.js';

import { Channel } from '../channel/channel.model';

import { MembershipEntryMethod } from '../enums/enums';
export { MembershipEntryMethod };

@Model({ api: { description: `Stored information about a registered user` } })
export class Membership extends BaseModel {
  @StringField({
    description: `The unique handle chosen by member`,
    unique: true
  })
  handle!: string;

  @StringField({
    nullable: true,
    description: `A Url to member's Avatar image`
  })
  avatarUri?: string;

  @StringField({
    nullable: true,
    description: `Short text chosen by member to share information about themselves`
  })
  about?: string;

  @StringField({
    description: `Member's controller account id`
  })
  controllerAccount!: string;

  @StringField({
    description: `Member's root account id`
  })
  rootAccount!: string;

  @IntField({
    description: `Blocknumber when member was registered`
  })
  registeredAtBlock!: number;

  @DateTimeField({
    description: `Timestamp when member was registered`
  })
  registeredAtTime!: Date;

  @EnumField('MembershipEntryMethod', MembershipEntryMethod, {
    description: `How the member was registered`
  })
  entry!: MembershipEntryMethod;

  @NumericField({
    nullable: true,
    description: `The type of subscription the member has purchased if any.`,

    transformer: {
      to: (entityValue: BN) => (entityValue !== undefined ? entityValue.toString(10) : null),
      from: (dbValue: string) =>
        dbValue !== undefined && dbValue !== null && dbValue.length > 0 ? new BN(dbValue, 10) : undefined
    }
  })
  subscription?: BN;

  @OneToMany(
    () => Channel,
    (param: Channel) => param.ownerMember
  )
  channels?: Channel[];

  constructor(init?: Partial<Membership>) {
    super();
    Object.assign(this, init);
  }
}

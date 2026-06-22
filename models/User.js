const crypto = require('node:crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_USERS_TABLE || 'medicojobs-users';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});




const FIELDS = [
  'id',
  'name',
  'email',
  'password',
  'role',
  'specialization',
  'licenseNumber',
  'experience',
  'bio',
  'phone',
  'currentLocation',
  'latitude',
  'longitude',
  'preferredLocations',
  'skills',
  'profileImage',
  'resumeUrl',
  'resumeAnalysis',
  'verified',
  'createdAt',
  'updatedAt',
];

const clone = (value) => structuredClone(value);

const normalize = (data = {}) => {
  const now = new Date().toISOString();
  const item = {
    id: data.id || data._id || crypto.randomUUID(),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    specialization: data.specialization || '',
    licenseNumber: data.licenseNumber || '',
    experience: Number(data.experience || 0),
    bio: data.bio || '',
    phone: data.phone || '',
    currentLocation: data.currentLocation || '',
    latitude: data.latitude === undefined || data.latitude === '' ? null : Number(data.latitude),
    longitude: data.longitude === undefined || data.longitude === '' ? null : Number(data.longitude),
    preferredLocations: Array.isArray(data.preferredLocations) ? data.preferredLocations : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    profileImage: data.profileImage || '',
    resumeUrl: data.resumeUrl || '',
    resumeAnalysis: data.resumeAnalysis || null,
    verified: Boolean(data.verified),
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  return Object.fromEntries(FIELDS.map((field) => [field, item[field]]));
};

class User {
  constructor(data = {}) {
    Object.assign(this, normalize(data));
    this._id = this.id;
  }

  static fromItem(item) {
    return item ? new User(item) : null;
  }

  static async create(data) {
    const user = new User(data);
    await user.save();
    return user;
  }

  static async findOne(query = {}) {
    if (!query.email) {
      throw new Error('Only email lookup is supported for User.findOne');
    }

    const result = await client.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#email = :email',
      ExpressionAttributeNames: {
        '#email': 'email',
      },
      ExpressionAttributeValues: {
        ':email': query.email,
      },
      Limit: 1,
    }));

    return User.fromItem(result.Items?.[0]);
  }

  static async findById(id) {
    const result = await client.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: String(id) },
    }));

    return User.fromItem(result.Item);
  }

  static async findByIdAndUpdate(id, updates = {}) {
    const existing = await User.findById(id);
    if (!existing) return null;

    const next = normalize({
      ...clone(existing),
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
    });

    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: next,
    }));

    return new User(next);
  }

  async save() {
    const item = normalize({
      ...clone(this),
      id: this.id,
      createdAt: this.createdAt,
    });

    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    Object.assign(this, item, { _id: item.id });
    return this;
  }

  select(projection) {
    if (projection !== '-password') return this;
    const copy = new User(this);
    delete copy.password;
    return copy;
  }

  toJSON() {
    const item = Object.fromEntries(FIELDS.map((field) => [field, this[field]]));
    item._id = this.id;
    return item;
  }

  async deleteOne() {
    await client.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id: this.id },
    }));
  }
}

module.exports = User;

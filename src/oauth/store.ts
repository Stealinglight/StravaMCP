import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

export interface OAuthClient {
  client_id: string;
  redirect_uris: string[];
  created_at: number;
  last_used_at?: number;
  client_name?: string;
}

export interface OAuthAuthCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: 'S256';
  scopes: string[];
  expires_at: number;
}

export interface OAuthTokenRecord {
  access_token: string;
  refresh_token: string;
  client_id: string;
  scopes: string[];
  access_expires_at: number;
  refresh_expires_at: number;
  expires_at: number;
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const REFRESH_TOKEN_INDEX = 'refresh_token_index';

export async function putClient(tableName: string, client: OAuthClient): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: client,
    })
  );
}

export async function getClient(
  tableName: string,
  clientId: string
): Promise<OAuthClient | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { client_id: clientId },
    })
  );
  return (result.Item as OAuthClient) || null;
}

export async function touchClient(tableName: string, clientId: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { client_id: clientId },
      UpdateExpression: 'SET last_used_at = :now',
      ExpressionAttributeValues: {
        ':now': Math.floor(Date.now() / 1000),
      },
    })
  );
}

export async function putAuthCode(tableName: string, code: OAuthAuthCode): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: code,
    })
  );
}

export async function consumeAuthCode(
  tableName: string,
  code: string
): Promise<OAuthAuthCode | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { code },
    })
  );
  if (!result.Item) {
    return null;
  }

  await ddb.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { code },
    })
  );

  return result.Item as OAuthAuthCode;
}

export async function putToken(tableName: string, token: OAuthTokenRecord): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: token,
    })
  );
}

export async function getTokenByAccess(
  tableName: string,
  accessToken: string
): Promise<OAuthTokenRecord | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { access_token: accessToken },
    })
  );
  return (result.Item as OAuthTokenRecord) || null;
}

export async function getTokenByRefresh(
  tableName: string,
  refreshToken: string
): Promise<OAuthTokenRecord | null> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: REFRESH_TOKEN_INDEX,
      KeyConditionExpression: 'refresh_token = :refresh',
      ExpressionAttributeValues: {
        ':refresh': refreshToken,
      },
      Limit: 1,
    })
  );

  return (result.Items?.[0] as OAuthTokenRecord) || null;
}

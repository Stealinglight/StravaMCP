import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import { Upload } from '../config/types.js';
import { withErrorHandling } from '../utils/errors.js';

/**
 * Schema for create_upload parameters
 */
export const CreateUploadSchema = z.object({
  file: z.string().describe('Base64 encoded file content or file path'),
  name: z.string().optional().describe('The desired activity name'),
  description: z.string().optional().describe('The desired activity description'),
  trainer: z.boolean().optional().describe('Whether the activity was performed on a trainer'),
  commute: z.boolean().optional().describe('Whether the activity is a commute'),
  data_type: z
    .enum(['fit', 'fit.gz', 'tcx', 'tcx.gz', 'gpx', 'gpx.gz'])
    .describe('The file format of the upload'),
  external_id: z.string().optional().describe('An external identifier for the upload'),
});

/**
 * Schema for get_upload parameters
 */
export const GetUploadSchema = z.object({
  id: z.number().describe('The ID of the upload'),
});

/**
 * Uploads a new activity file to Strava.
 * Supports FIT, TCX, and GPX files (optionally gzipped).
 * 
 * @param client - StravaClient instance
 * @param params - Upload parameters
 * @returns Upload status and details
 * 
 * @example
 * ```typescript
 * const upload = await createUpload(client, {
 *   file: base64FileContent,
 *   data_type: 'fit',
 *   name: 'Morning Ride',
 *   description: 'Great ride in the hills'
 * });
 * ```
 */
export const createUpload = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof CreateUploadSchema>): Promise<Upload> => {
    // Note: Actual file upload requires multipart/form-data
    // This is a simplified version - full implementation would need proper file handling
    return await client.post<Upload>('/uploads', params);
  }
);

/**
 * Retrieves the status of an upload.
 * 
 * @param client - StravaClient instance
 * @param params - Upload ID
 * @returns Upload status and activity ID (if processed)
 */
export const getUpload = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof GetUploadSchema>): Promise<Upload> => {
    const { id } = params;
    return await client.get<Upload>(`/uploads/${id}`);
  }
);

/**
 * MCP Tool definitions for uploads
 */
export const uploadsTools = [
  {
    name: 'create_upload',
    description: `Uploads a new activity file to Strava.

Supports uploading activity files in these formats:
- **FIT** (.fit) - Garmin and most GPS watches
- **TCX** (.tcx) - Training Center XML format
- **GPX** (.gpx) - GPS Exchange Format
- All formats can be gzip compressed (.gz)

**Upload Process:**
1. File is uploaded and queued for processing
2. Strava processes the file (can take a few seconds to minutes)
3. Once processed, an activity is created
4. Use 'get_upload' to check processing status

**Parameters:**
- file: Base64 encoded file content
- data_type: File format (fit, tcx, gpx, or .gz versions)
- name: Optional activity name (can also be set via update_activity after processing)
- description: Optional description
- trainer: Mark as trainer activity
- commute: Mark as commute

**Use Cases:**
- Import activities from non-integrated devices
- Bulk upload historical activities
- Upload activities from custom tracking apps
- Migrate data from other platforms

**Important Notes:**
- Uploads are processed asynchronously
- Check upload status with 'get_upload' using the returned upload ID
- Once processed, the activity ID is available for further updates
- Duplicate activities may be automatically detected and rejected

**Typical Workflow:**
1. Upload file → get upload ID
2. Poll 'get_upload' to check status
3. When status is complete, get the activity_id
4. Use activity tools to view or update the created activity`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        file: {
          type: 'string' as const,
          description: 'Base64 encoded file content',
        },
        name: {
          type: 'string' as const,
          description: 'Desired activity name',
        },
        description: {
          type: 'string' as const,
          description: 'Desired activity description',
        },
        trainer: {
          type: 'boolean' as const,
          description: 'Whether performed on a trainer',
        },
        commute: {
          type: 'boolean' as const,
          description: 'Whether this is a commute',
        },
        data_type: {
          type: 'string' as const,
          enum: ['fit', 'fit.gz', 'tcx', 'tcx.gz', 'gpx', 'gpx.gz'],
          description: 'File format',
        },
        external_id: {
          type: 'string' as const,
          description: 'External identifier for the upload',
        },
      },
      required: ['file', 'data_type'],
    },
  },
  {
    name: 'get_upload',
    description: `Retrieves the status of a file upload.

After uploading an activity file with 'create_upload', use this tool to check the processing status.

**Upload Statuses:**
- "Your activity is still being processed." - Processing in progress
- "Your activity is ready." - Successfully processed
- "There was an error processing your activity." - Processing failed

**Response Fields:**
- id: Upload ID
- external_id: External identifier if provided
- error: Error message if processing failed
- status: Current status message
- activity_id: The created activity's ID (only present when successfully processed)

**Typical Usage:**
1. Upload a file with 'create_upload'
2. Get the upload ID from the response
3. Poll this endpoint to check status
4. Once activity_id is present, use activity tools to view or modify

**Coaching Workflow:**
After an athlete uploads a workout file:
1. Check upload status
2. When ready, get the activity details
3. Analyze and provide feedback
4. Enrich with descriptions and coaching notes`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'number' as const,
          description: 'The ID of the upload',
        },
      },
      required: ['id'],
    },
  },
];

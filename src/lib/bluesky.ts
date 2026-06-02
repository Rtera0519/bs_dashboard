import { BskyAgent } from '@atproto/api';

interface VerificationResult {
  success: boolean;
  displayName?: string;
  did?: string;
  error?: string;
}

interface PublishResult {
  success: boolean;
  uri?: string;
  cid?: string;
  error?: string;
}

export async function verifyCredentials(handle: string, appPasswordDecrypted: string): Promise<VerificationResult> {
  // Mock credentials validation fallback
  if (handle.includes('mock') || appPasswordDecrypted.startsWith('mock_')) {
    return {
      success: true,
      displayName: 'Alex Mercer (Mock)',
      did: 'did:plc:mockdid1234567890',
    };
  }

  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    const response = await agent.login({
      identifier: handle,
      password: appPasswordDecrypted,
    });
    
    return {
      success: true,
      displayName: response.data.email || handle, // If no display name, use handle
      did: response.data.did,
    };
  } catch (error: any) {
    console.error('Bluesky login verification failed:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
}

export async function publishPost(handle: string, appPasswordDecrypted: string, text: string): Promise<PublishResult> {
  // Mock publish fallback for testing
  if (handle.includes('mock') || appPasswordDecrypted.startsWith('mock_')) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay
    const mockPostId = Math.random().toString(36).substring(2, 10);
    return {
      success: true,
      uri: `at://did:plc:mockdid1234567890/app.bsky.feed.post/${mockPostId}`,
      cid: `mockcid_${mockPostId}`,
    };
  }

  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    await agent.login({
      identifier: handle,
      password: appPasswordDecrypted,
    });

    const response = await agent.post({
      text: text,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      uri: response.uri,
      cid: response.cid,
    };
  } catch (error: any) {
    console.error('Bluesky post publish failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to publish post',
    };
  }
}

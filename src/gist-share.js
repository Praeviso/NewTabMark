export function getStoredGistToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['githubGistToken'], (result) => {
      resolve(result.githubGistToken || '');
    });
  });
}

export function setStoredGistToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ githubGistToken: token }, () => resolve());
  });
}

function normalizeToken(token) {
  return String(token || '').trim();
}

export async function createGist({ token, filename, content, description = '', isPublic = false }) {
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) throw new Error('Missing GitHub token');

  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'Authorization': `token ${normalizedToken}`
    },
    body: JSON.stringify({
      description,
      public: Boolean(isPublic),
      files: {
        [filename]: { content }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GitHub API error (${response.status}): ${text || response.statusText}`);
  }

  return response.json();
}


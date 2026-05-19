export function validateRepoUrl(value: string): string | null {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return 'Repository URL is required.'
  }

  try {
    const parsedUrl = new URL(normalizedValue)

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'Only HTTP and HTTPS repository URLs are supported.'
    }

    if (parsedUrl.hostname !== 'github.com') {
      return 'Use a GitHub repository URL.'
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)

    if (pathSegments.length < 2) {
      return 'Repository URL must include owner and repository name.'
    }

    return null
  } catch {
    return 'Repository URL is invalid.'
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!apiBaseUrl) {
  throw new Error('Missing VITE_API_BASE_URL. Define it in your Vite env file or deploy config.')
}

export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, '')

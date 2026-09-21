import { contextBridge } from 'electron'

// Pont IPC typé exposé au renderer — rempli au fil des phases (voir docs/API_CONTRACT.md).
// Le renderer n'accède jamais à Node.js ou à Prisma directement : tout passe par ici.
contextBridge.exposeInMainWorld('api', {})

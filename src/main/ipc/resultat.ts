import type { IpcResult } from '../../shared/types'
import { ErreurMetier } from '../services/erreurs'

// Applique la convention de réponse IPC (docs/API_CONTRACT.md, "Conventions générales") :
// tout handler renvoie { ok: true, data } ou { ok: false, error: { code, message } }, jamais
// une exception brute vers le renderer.
export async function versResultat<T>(fn: () => Promise<T>): Promise<IpcResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, error: { code: error.code, message: error.message } }
    }
    return {
      ok: false,
      error: {
        code: 'ERREUR_INATTENDUE',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

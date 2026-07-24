import { buildStreamUrlWithFallback } from './Megaplay.service';
import { buildVidnestUrl, VIDNEST_SERVERS } from './Vidnest.service';

export const SERVERS = [
  { id: 'megaplay', label: 'Server 1', name: 'MegaPlay', type: 'megaplay' },
  {
    id: 'vidnest-anime',
    label: 'Server 2',
    name: 'Vidnest Anime',
    type: 'vidnest',
    vidnestServer: VIDNEST_SERVERS.ANIME,
  },
  {
    id: 'vidnest-animepahe',
    label: 'Server 3',
    name: 'Vidnest AnimePahe',
    type: 'vidnest',
    vidnestServer: VIDNEST_SERVERS.ANIMEPAHE,
  },
];

export const DEFAULT_SERVER = 'megaplay';

/**
 * Build the embed URL for any server.
 * @param {string} serverId - one of SERVERS[].id
 * @param {string|number} anilistId
 * @param {string|number} episode
 * @param {string} language - 'sub' or 'dub'
 */
export function buildEmbedUrl(serverId, anilistId, episode, language = 'sub') {
  const server = SERVERS.find((s) => s.id === serverId);
  if (!server) return null;

  if (server.type === 'megaplay') {
    const { primary } = buildStreamUrlWithFallback(anilistId, episode, language);
    return primary;
  }

  if (server.type === 'vidnest') {
    return buildVidnestUrl(server.vidnestServer, anilistId, episode, language);
  }

  return null;
}

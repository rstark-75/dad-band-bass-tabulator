import {
  CreateSongRequestDto,
  parsePlaylistDto,
  parseSongChartDto,
  parseSongDto,
  parseSongMetadataDto,
  parseSongMetadataListDto,
  PlaylistDto,
  ReplacePlaylistOrderRequestDto,
  ReplaceSongChartRequestDto,
  SongChartDto,
  SongDto,
  SongMetadataDto,
  UpdateSongMetadataRequestDto,
} from './contracts';

export interface BassTabApi {
  listSongs(): Promise<SongMetadataDto[]>;
  getSong(songId: string): Promise<SongDto>;
  createSong(payload: CreateSongRequestDto): Promise<SongDto>;
  updateSongMetadata(songId: string, payload: UpdateSongMetadataRequestDto): Promise<SongMetadataDto>;
  replaceSongChart(songId: string, payload: ReplaceSongChartRequestDto): Promise<SongChartDto>;
  deleteSong(songId: string): Promise<void>;
  getPlaylist(): Promise<PlaylistDto>;
  replacePlaylistOrder(payload: ReplacePlaylistOrderRequestDto): Promise<PlaylistDto>;
}

export interface BassTabApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const joinPath = (baseUrl: string, path: string): string =>
  `${trimTrailingSlash(baseUrl)}${path.startsWith('/') ? path : `/${path}`}`;

export class HttpBassTabApi implements BassTabApi {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: BassTabApiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async listSongs(): Promise<SongMetadataDto[]> {
    return this.request('/v1/songs', { method: 'GET' }, parseSongMetadataListDto);
  }

  async getSong(songId: string): Promise<SongDto> {
    return this.request(`/v1/songs/${encodeURIComponent(songId)}`, { method: 'GET' }, parseSongDto);
  }

  async createSong(payload: CreateSongRequestDto): Promise<SongDto> {
    return this.request(
      '/v1/songs',
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      },
      parseSongDto,
    );
  }

  async updateSongMetadata(
    songId: string,
    payload: UpdateSongMetadataRequestDto,
  ): Promise<SongMetadataDto> {
    return this.request(
      `/v1/songs/${encodeURIComponent(songId)}/metadata`,
      {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      },
      parseSongMetadataDto,
    );
  }

  async replaceSongChart(songId: string, payload: ReplaceSongChartRequestDto): Promise<SongChartDto> {
    return this.request(
      `/v1/songs/${encodeURIComponent(songId)}/chart`,
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      },
      parseSongChartDto,
    );
  }

  async deleteSong(songId: string): Promise<void> {
    await this.request(`/v1/songs/${encodeURIComponent(songId)}`, { method: 'DELETE' }, () => undefined);
  }

  async getPlaylist(): Promise<PlaylistDto> {
    return this.request('/v1/playlist', { method: 'GET' }, parsePlaylistDto);
  }

  async replacePlaylistOrder(payload: ReplacePlaylistOrderRequestDto): Promise<PlaylistDto> {
    return this.request(
      '/v1/playlist/order',
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      },
      parsePlaylistDto,
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    parse: (payload: unknown) => T,
  ): Promise<T> {
    const response = await this.fetchImpl(joinPath(this.options.baseUrl, path), init);

    if (!response.ok) {
      let errorDetail = '';

      try {
        errorDetail = await response.text();
      } catch (_error) {
        errorDetail = '';
      }

      const detailSuffix = errorDetail ? ` - ${errorDetail}` : '';
      throw new Error(`BassTab API ${response.status} ${response.statusText}${detailSuffix}`);
    }

    if (response.status === 204) {
      return parse(undefined);
    }

    return parse(await response.json());
  }
}

export const createBassTabApi = (options: BassTabApiClientOptions): BassTabApi =>
  new HttpBassTabApi(options);

export const createBassTabApiFromEnv = (): BassTabApi | null => {
  const baseUrl = process.env.EXPO_PUBLIC_BASSTAB_API_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  return createBassTabApi({ baseUrl });
};

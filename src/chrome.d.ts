declare const chrome: {
  runtime: {
    getManifest(): { version: string }
    getURL(path: string): string
    sendMessage(
      message: unknown,
      responseCallback?: (response: unknown) => void,
    ): void
    lastError?: { message?: string }
    onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: unknown,
          sendResponse: (response?: unknown) => void,
        ) => boolean | void,
      ): void
    }
  }
  tabs: {
    create(createProperties: { url: string; active?: boolean }): void
    query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback: (tabs: Array<{ id?: number; url?: string }>) => void,
    ): void
  }
  action: {
    onClicked: {
      addListener(
        callback: (tab?: { id?: number; url?: string }) => void,
      ): void
    }
  }
  storage?: {
    local: {
      get(
        keys?: string | string[] | Record<string, unknown> | null,
      ): Promise<Record<string, unknown>>
      set(items: Record<string, unknown>): Promise<void>
      remove(keys: string | string[]): Promise<void>
    }
    onChanged: {
      addListener(
        callback: (
          changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
          areaName: string,
        ) => void,
      ): void
    }
  }
  offscreen?: {
    createDocument(options: {
      url: string
      reasons: string[]
      justification: string
    }): Promise<void>
    closeDocument(): Promise<void>
  }
  tabCapture?: {
    getMediaStreamId(options: {
      targetTabId?: number
      consumerTabId?: number
    }): Promise<string>
  }
}

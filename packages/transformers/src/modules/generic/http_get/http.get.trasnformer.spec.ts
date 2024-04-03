import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { HttpGetTransformer } from "./http.get.transformer";

describe('HttpGetTransformer', () => {
  const mockXMessage: XMessage = {
    messageType: MessageType.TEXT,
    messageId: {
      Id: "4305161194925220864-131632492725500592",
      channelMessageId: "4305161194925220864-131632492725500592",
    },
    to: {
      userID: "9999999999",
    },
    from: {
      userID: "admin",
      bot: true,
      meta: new Map(Object.entries({
        botMobileNumber: "919999999999",
      })),
    },
    channelURI: "",
    providerURI: "",
    timestamp: 4825,
    messageState: MessageState.REPLIED,
    payload: {
      text: "Testing bot",
    },
  };

  beforeEach(() => {
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw an error when `url` is not defined in config', async () => {
    const mockConfig = {
      query: '?param=value',
      headers: { 'Authorization': 'Bearer TOKEN' },
    };
    const httpGetTransformer = new HttpGetTransformer(mockConfig);
    await expect(httpGetTransformer.transform(mockXMessage)).rejects.toThrowError('`url` not defined in HTTP_GET transformer');
  });

  it('should handle GET request failure and throw an error with the failed response code', async () => {
    const mockConfig = {
      url: 'https://example.com/api',
    };
    const httpGetTransformer = new HttpGetTransformer(mockConfig);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Request failed with code:'));

    await expect(httpGetTransformer.transform(mockXMessage)).rejects.toThrowError('Request failed with code:');
  });

  it('should transform XMessage with valid config', async () => {

    const mockResponse = { key: 'value', status: 200 };
    const mockJsonPromise = Promise.resolve(mockResponse);
    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => mockJsonPromise,
      headers: {
        get: () => 'application/json',
      }
    });

    (global.fetch as jest.Mock).mockImplementation(() => mockFetchPromise);

    const mockConfig = {
      url: 'https://www.google.com/',
      query: '?param=value',
      headers: { 'Authorization': 'Bearer TOKEN' },
    };

    const httpGetTransformer = new HttpGetTransformer(mockConfig);
    const expectedModifiedXMessage: XMessage = {
      ...mockXMessage,
      transformer: {
        metaData: {
          httpResponse: { key: 'value', status: 200 },
        },
      },
    };
    await expect(httpGetTransformer.transform(mockXMessage)).resolves.toEqual(expectedModifiedXMessage);
  });
});
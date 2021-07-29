import { NextApiRequest, NextApiResponse } from 'next';

export default async (
  _: NextApiRequest,
  response: NextApiResponse
): Promise<void> => {
  response.clearPreviewData();

  response.writeHead(307, { Location: '/' });
  response.end();
};

import { Method, request } from '@watsonserve/connector';

export async function loadGalleryPictures(offset = 0, rn = 20) {
  const rangeVal = `item=${offset}-${offset+rn}`;
  const { data } = await request({
    api: `${globalThis.location?.origin || ''}/Pictures/`,
    method: Method.GET,
    headers: { Range: rangeVal }
  });
  return { offset, list: data as string[] };
}

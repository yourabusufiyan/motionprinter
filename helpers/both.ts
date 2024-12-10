import axios from 'axios'
import { dropRight, floor, last, fill } from 'lodash'

export async function checkPing(option: { url?: string }): Promise<boolean> {

  let url = `http://${option.url}:9457/api/v1/ping`
  console.log('checkPing : ', url)

  return await axios.get(url)
    .then((expiresAt) => {
      console.log('checkPing : ', url, ' : true')
      return true
    })
    .catch((err) => {
      console.log('checkPing : ', url, ' : false')
      return false;
    });

}

export function ip_to_sequence(
  { ip, singleSequence = true, arraySize = 20 }:
    { ip: string, singleSequence?: boolean, arraySize?: number }
): any {

  let ipLeft = dropRight(ip.split('.'))
  let ipSeries: number = floor(Number(last(ip.split('.'))), -1)

  return fill(Array(arraySize), 'a').map((el, i) => `${ipLeft.join('.')}.${ipSeries + i}`);

}


export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

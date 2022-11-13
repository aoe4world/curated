import airtableJson from 'airtable-json';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

import YTInfo from 'youtube-stream-url';

let content = await airtableJson({
  auth_key: process.env.AUTH_KEY, // this is your airtable api key, starting with 'key'
  base_name: process.env.BASE_NAME, // this is the base api key, which starts with 'app'
  primary: 'Content', // this is the table name you want to pull
  view: 'Main', // this is the view you want to pull
});

const parsedData = JSON.parse(fs.readFileSync('content.json'));

for (const item of content) {
  //Delete the ID field that AirTable uses
  delete item.__id;

  //Checks if the Video is a Youtube Link
  if (
    (item.type === 'Video' || item.type === 'Shorts') &&
    new URL(item.url).hostname.endsWith('youtube.com')
  ) {
    const fetchedBefore = parsedData.find((x) => x.url === item.url);
    if (fetchedBefore) {
      item.youtube_data = fetchedBefore.youtube_data;
      item.thumbnail ??= fetchedBefore.thumbnail;
      item.creator_url ??= fetchedBefore.creator_url;
    } else {
      await YTInfo.getInfo({ url: item.url }).then((video) => {
        console.log('YT Title: ' + video.videoDetails.title);
        item.youtube_data = {
          title: video.videoDetails.title,
          videoId: video.videoDetails.videoId,
          channelId: video.videoDetails.channelId,
          videoDuration: video.videoDetails.lengthSeconds,
        };
        //Check if a thumbnail URL already exists, if not add it.
        if (!item.thumbnail) {
          item.thumbnail =
            video.videoDetails.thumbnail.thumbnails[
              video.videoDetails.thumbnail.thumbnails.length - 1
            ].url;
        }
        //Check if Creator_URL exists, if not create it from the channelID.
        //This does NOT get the Custom URL
        if (!item.creator_url) {
          item.creator_url = `https://youtube.com/channel/${video.videoDetails.channelId}`;
        }
      });
    }
  } else {
    console.log(`Skipping non video: ${item.title}`);
  }
}

//console.log(content)
//Delete non approved items
content = content.filter((x) => x.approved);

let data = JSON.stringify(content, null, 2);
fs.writeFileSync('content.json', data);

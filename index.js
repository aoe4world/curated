import airtableJson from 'airtable-json'
import fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config()

import YTInfo from 'youtube-stream-url'

const content = await airtableJson({
  auth_key: process.env.AUTH_KEY, // this is your airtable api key, starting with 'key'
  base_name: process.env.BASE_NAME, // this is the base api key, which starts with 'app'
  primary: "Content", // this is the table name you want to pull
  view: "Main" // this is the view you want to pull
})

//Remove any Non Approved Items and Airtable ID
for (let i = 0; i < content.length; i++) {
  //Delete the ID field that AirTable uses
  delete content[i].__id

  //Delete non approved items
  if (!content[i].approved) {
    content.splice(i, 1)
  }
}

//Get youtube data
for (let i = 0; i < content.length; i++) {
  
  let videoInfo;
  
  //Checks if the Video is a Youtube Link
  if ((content[i].type === "Video" || content[i].type === "Shorts")
    && new RegExp("youtu").test(content[i].url)) {

    videoInfo = await YTInfo.getInfo({ url: content[i].url }).then(video => {
      console.log("YT Title: " + video.videoDetails.title)
      content[i].youtube_data = {
        title: video.videoDetails.title,
        videoId: video.videoDetails.videoId,
        channelId: video.videoDetails.channelId,
        videoDuration: video.videoDetails.lengthSeconds
      }
      //Check if a thumbnail URL already exists, if not add it.
      if (!content[i].thumbnail) {
        content[i].thumbnail = video.videoDetails.thumbnail.thumbnails[video.videoDetails.thumbnail.thumbnails.length - 1].url
      }
      //Check if Creator_URL exists, if not create it from the channelID. 
      //This does NOT get the Custom URL
      if (!content[i].creator_url) {
        content[i].creator_url = `https://youtube.com/channel/${video.videoDetails.channelId}`
      }
    })
  } else {
    console.log(`Skipping non video: ${content[i].title}`)
  }
}

//console.log(content)

let data = JSON.stringify(content);
fs.writeFileSync('Content.json', data);
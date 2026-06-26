# alovelywallpaper
https://alexfarrill.github.io/alovelywallpaper/index.rss

## Episode Audio Hosting

Episode MP3 files are served from direct S3 URLs in the RSS feed:

```text
https://alovelywallpaper.s3.us-west-2.amazonaws.com/episodes/
```

There is currently no CloudFront distribution in the AWS account for the
`alovelywallpaper` bucket or for the direct S3 episode URLs used in `index.rss`.
When replacing an existing episode object in S3, verify the public S3 endpoint
directly with `curl -i` and confirm the returned `Content-Length` matches the
uploaded file.

AWS cache invalidation is not applicable unless a CloudFront distribution is
added in front of the episode URLs. Podcast apps and directories may still cache
audio independently. If a hard cache bust is needed for those clients, upload the
replacement audio under a new filename and update the RSS enclosure URL.

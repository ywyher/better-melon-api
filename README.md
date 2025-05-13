# What is it ?
An API made to fetch required data to run [Better Melon](https://github.com/ywyher/better-melon)

# Supported features
- Support providers
  - hianime
- Anime general data
- Japanese subtitle files
- Anime streaming data
  - Streaming links
  - English subtitle files

# Better Melon Mapper Self-Hosting Guide
> [!note]
> this API utilizes [bun](https://bun.sh) make sure you have that installed

## Quick Start

```sh
git clone https://github.com/ywyher/better-melon-mapper ./better-melon-mapper
cd ./better-melon-mapper
```

### 2. Run required services
- Create an account on [Jimaku.cc](https://jimaku.cc) and generate an API token
- Set up AniList API credentials at [anilist.co/settings/developer](https://anilist.co/settings/developer)
- Set up Aniwatch API by following [this repo's](https://github.com/ghoshRitesh12/aniwatch-api) readme

### 3. Setup enviroment variables
```.env
PORT=6969
ANILIST_URL=https://graphql.anilist.co/
ANIWATCH_URL=http://localhost:4000/api/v2/hianime
JIMAKU_KEY=
JIMAKU_URL=https://jimaku.cc
```

### 4. Install dependencies and start the API
```sh
bun i && bun dev
```

# Credit
- [Better Melon](https://github.com/ywyher/better-melon) -> what is the purpose of better-melon-mapper without better-melon am i right ??
- [Anilist](https://anilist.co/) -> Used to fetch anime general data
- [Jimaku](https://jimaku.cc/) -> Used to fetch japanese subtitles
- [Aniwatch API](https://github.com/ghoshRitesh12/aniwatch-api) -> Used to fetch anime streaming data
- [ywyh (Me)](https://github.com/ywyher) – for being goated ig

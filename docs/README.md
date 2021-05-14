---
layout: page
title: About Spjall
permalink: /readme/
nav_order: 2

---

* TOC
{:toc}

# About

Samrómur chat is a VoIP web application written in Typescript.

## Backend
Simple ExpressJs server handling the following tasks
* Serves a built/minified frontend in production mode
* WebSocket signalling server
* RESTful API to handle data uploads

## Frontend
The frontend is a client side rendered React app originally generated with create-react-app
* WebRTC peer to peer voice chat
* Web Worker encodes audio to waveform

# Contributing


### Prerequisites
* Node.js version 12+
* MySQL 8.0.19
* ffmpeg

### Development
*concurrently* takes care of running the backend and frontend dev servers simultaneously.

```
npm install
npm run dev
```

### Production
The *build* command builds both backend and frontend.

The *start* command runs the backend in production mode, serving the pre-built frontend on localhost:3030.
```
npm run build
npm run start # this might not last through restarts or ssh sessions
```

```
pm2 stop spjall.samromur
git pull
npm run build
pm2 restart spjall.samromur  # for new intance: pm2 start npm -- start

```

### Generating docs

[Install jekyll following the github guide](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll).

```
# Generate the docs for the run book
cd docs
bundle exec jekyll build

# Generating the docs for the frontend and backend.
cd ../
npm run docs

# Locally view the website
cd docs
bundle exec jekyll serve --skip-initial-build -o
```

## Credit
Robot logo is made by [common-voice](https://github.com/common-voice/common-voice) which is licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/).
Headset icons are made by [Freepik](https://www.flaticon.com/authors/freepik) from [www.flaticon.com](http://www.flaticon.com/).

## License
[MIT License](/LICENSE)

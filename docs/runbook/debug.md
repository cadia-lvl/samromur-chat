---
layout: page
title: Runbook
permalink: /runbook/debug
---

* TOC
{:toc}

As Spjall has a lot of bugs right now we often need to spot bugs easily. This
means whenever possible, we should run Spjall in debug mode. 

### Requirements: 
1. A desktop (Windows, Mac OS, or Linux).
2. It's best to use Firefox or Chrome when debugging.


### Running Spjall in debug mode
First, open a new browser window. Then right-click on the browser window and
select **Inspect Element(Q)** on Firefox and **Inspect** on Chrome.

This opens up the browser developer tools. Then, you should navigate to the
**Console** tab. There should only be a blinking cursor there right now. Also,
be aware of the **Network** tab. Keep the browser dev tools open from now on.

Now that the browser dev tools are open, you open [spjall][spjall-url] in the
same tab/window.

Use spjall as normal while keeping an eye on the Console for any red error
messages.

When first creating a chatroom in Chrome, a few errors will pop up immediately.
If they're any of the following errors then ignore them:

#### Known errors

1. 
```
[Report Only] Refused to create a worker from 'https://spjall.samromur.is/static/js/worker.b37a6f62.worker.js' because it violates the following Content Security Policy directive: "worker-src 'none'"
```

2. 
```
POST about:blank net::ERR_UNKNOWN_URL_SCHEME
```

However, if any red error messages pop up after the console log **initiating
connection to microphone** then please screenshot them. Also, check if there
are any red network connections. If so screenshot them and send the screenshots
of both the **Console** and the **Network** tabs to the developers (Staffan or
Judy).

When messaging the developers, also include a detailed report of any errors or
non perfect behavior within the recording and or sending process. If there were
no errors or strange behaviour, indicate that spjall was running perfectly.

When you've finished using spjall, you can navigate away and close the
developer tools.

Thank you for your help in making a better Spjall.


[spjall-url]: https://spjall.samromur.is


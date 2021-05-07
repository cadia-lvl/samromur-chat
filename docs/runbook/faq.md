---
layout: page
title: Frequently Asked Questions
permalink: /runbook/faq
---

* TOC
{:toc}

# Frequently Asked Questions

## Recording Session Errors

### I can't hear the other participant but I can see their username and they're green.

Try rejoining the chatroom. If that doesn't work, try to use a different
browser: Safari, Chrome, or Firefox.

If you still can't hear the other participant then Spjall doesn't work for your
device or your friend's device. One of you should try to access spjall on a
different device and see if that works. If it still doesn't work, then you
should [report this problem to the spjall developers](/runbook/faq#it-doesnt-seem-to-work-how-can-i-report-the-problem-to-the-developers).

### I'm using Safari but I get a message that I should use Chrome or Firefox instead.

If you are on Safari then you need to have MediaRecorder enabled.

Check if it's enabled by following the below workflows:

**macbook:**
    If you don’t see the Develop tab in the Safari menu, choose Safari >
Preferences > Advanced, then enable **Show Develop menu in menu bar.**

Now you should see the Develop tab so do the following:
    Safari > Develop > Experimental Features > MediaRecorder > Enable

**ios(iphone/ipad):** Settings > Safari > Advanced > Experimental Features >
MediaRecorder > Enable

### I'm on Edge and I can't access the mic. What do I do?

For some people, Edge does not automatically ask for access to the mic. To
enable your mic for Edge, go to your Edge Settings. Then go to the following:
Cookies and site permissions > click on Microphone > and enable **Ask before
accessing (recommended)**.

### Is it ok to have background noise?

Yes. However it's recommended that you cannot hear yourself in your friend's audio.


### Is it ok that I/my friend can hear myself/himself/herself?

It's better if you cannot hear yourself. But this data can still be used.

### I pressed the send in button and nothing happened so I pressed it again. Is that ok?

Yes, it's ok to press send in more than once. If nothing happens after another
minute then press the send in button again.  The button should work now and
when it's done it'll bring you to the thank you page.

### I pressed the send in button and nothing seems to happen. What do I do?

If nothing happens after another minute then press the send in button again.
The button should work now and when it's done it'll bring you to the thank you
page.


### My friend sent me the spjall link through Messenger. However, when I open it in the in-app browser it says Spjall doesn't work for my browser.

Spjall does not work in the in-app browser for mobile devices. So, you'll need to open Spjall in the bbrowser app available on your phone: Firefox for Android and Safari for ios devices (iphone/ipad).

For ios, read the Safari [recording instructions](/runbook/recording-instructions#apple-ios).

### It doesn't seem to work. How can I report the problem to the developers?

First, check the FAQ for your problem. If it's not listed then run [spjall in
debug mode](/runbook/debug).

Second send in a report with the following details:
* What operating system are you using?
* What browser are you using?
* Are there two participants in the chatroom?
* Can you see both participants' names in the chatroom?
* Are both participants' dots green?
* Have you started recording?
* Did you both reach the thank you page?
* Check the browser web dev tools Console tab for any red error messages.
    Screenshot them or copy and paste them.
* Describe the problem in detail:

## Admin Page Errors


### My friend recorded a conversation but I cannot see it on the admin page. Why?

There was likely a problem with the files. A recording session only appears on
the admin page if both the audio files are present and both the json
demographic files exist.

Any of the following can prevent the recording from appearing on the admin page:

* Your friend recorded with only one person in the chatroom.
* They did not get the thank you page so they did not complete the recording process.



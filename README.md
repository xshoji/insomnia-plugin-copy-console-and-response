# insomnia-plugin-copy-console-and-response

A powerful plugin for Insomnia REST Client that enhances your API testing workflow by allowing you to easily copy and format both console logs and API response data with a single click.

[demo](https://github.com/user-attachments/assets/fe2669da-be2e-4355-a00b-08f1ca39644c)



## Overview

This plugin adds a "Console" button to your Insomnia interface that, when clicked, collects and copies to your clipboard:
- Request timestamp and response time metrics
- Complete HTTP request and response headers
- Formatted response body (with pretty-printing for JSON)

Perfect for debugging, documentation, and sharing API interactions with team members. The plugin automatically masks sensitive information like authorization tokens and cookies for security.

## Main Features

- One-click copying of complete request/response data
- Automatic masking of sensitive information
- Pretty formatting of JSON responses
- Configurable display options for timeline and connection details
- Local time conversion for timestamp headers

## Configuration Options

The plugin provides several configuration options:

### displayCurrentLocalTime

```javascript
displayCurrentLocalTime: false,
```

When set to `true`, this option adds the local time next to Date headers in GMT format in the console output. This is helpful when you need to see response timestamps in your local timezone rather than just in GMT format.

Example output when enabled:
```
Date: Wed, 15 Mar 2023 08:30:45 GMT ( LocalTime: 2023-03-15 Wed 17:30:45 - provided by insomnia-plugin-copy-console-and-response )
```

### hideConnectionProcessDetails

```javascript
hideConnectionProcessDetails: false,
```

When set to `true`, this option filters out connection process details from the console output. This removes connection establishment information, TLS handshake details, and other low-level networking information that starts with an asterisk (*).


## How to Use

```
cd "/Users/user/Library/Application Support/Insomnia/plugins"
git clone https://github.com/xshoji/insomnia-plugin-copy-console-and-response
```

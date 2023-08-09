<a name="readme-top"></a>


<!-- PROJECT SHIELDS -->
[![Next][Node.js]][Node-url]
[![Typescript][Typescript]][Typescript-url]
[![Javascript][Javascript]][Javascript-url]
[![Telegram][Telegram]][Telegram-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">

  <a href="https://github.com/ParsleyJ/cyborgram">
    <img src="images/cyborg.png" alt="Logo" width="80" height="80">
  </a>


<h3 align="center">Cyborgram</h3>

  <p align="center">
    Get Telegram superpowers ⚡ by embedding a JS interpreter in your chats 🤖
    <!--
    <br />
    <a href="https://github.com/ParsleyJ/cyborgram"><strong>Explore the docs »</strong></a>
    -->
    <br />
    <a href="https://github.com/ParsleyJ/cyborgram/issues">Report Bug/Request Feature</a>
  </p>
</div>




<!-- ABOUT THE PROJECT -->

## Power up your chat

Cyborgram is a headless Telegram client that can be launched on a [Node.js][Node-url] server.
As soon as it starts, it watches for *your* new messages, written on any chat, from any other client associated to your
Telegram account, e.g., your smartphone.

If those messages start with special characters (for example, `?`, `?=` or `)`), then the rest of the message is
interpreted as Javascript code:

| ![Example GIF 1][example-gif-1] | ![Example GIF 2][example-gif-2] |
|---------------------------------|---------------------------------|
| ![Example GIF 3][example-gif-3] | ![Example GIF 4][example-gif-4] |

<!-- GETTING STARTED -->

## Getting started

#### 1. Get your `api_id` and `api_hash`

Grab them from the [Telegram App configuration page](https://my.telegram.org/apps).

#### 2. Install Cyborgram

```bash
  npm install cyborgram
```

#### 3. Create a _Preamble_ channel (optional)

You can select a _preamble_ channel.
In the preamble you can write portions of JS code that will be executed each time you execute a command. Any declaration
in the preamble (e.g., `function`s and `let`/`const`s) will be available in the scope of your commands.

Just create a new private channel on Telegram. You don't need to share it with other users.
Once you create the channel, take note of its ID (using Plus Messenger or @RawDataBot).

You can skip this step. In this case, your preamble will be empty.

#### 4. Create an _Error Dump_ chat (optional)

Just as the preamble, create a new chat. All the messages of the errors that might be caused by the commands will be
dumped here.
Once you create the chat, take note of its ID.

You can skip this step. If you do, your _Saved Messages_ chat will be used instead.

#### 5. Create a keys JSON file and give it an arbitrary name (e.g., `mykeys.json`):

Create a JSON file with the required IDs and API keys:

```json
{
  "apiID": 1234567890,
  "apiHash": "abc123def456ghi789",
  "selfID": "0987654321",
  "errDumpID": "11111111111111",
  "preambleID": "-1004567890123"
}
```

* `apiID`: your Telegram `api_id`
* `apiHash`: your Telegram `api_hash`
* `selfID`: the ID of the "Saved Messages" chat
* `errDumpID` (optional): the chat where all error messages are dumped to - defaults to _Saved Messages_
* `preambleID` (optional): the channel used as preamble

#### 6. Start Cyborgram and Login

Launch Cyborgram, ensuring to set the `KEYS_FILE` environment variable pointing to your keys file.

```bash
KEYS_FILE=path/to/keysFile.json npx cyborgram
```

The first time you launch it, you will need to log in to Telegram. Be sure to include the international prefix (e.g.,
+39 for Italy) in the phone number.

```
Please enter your number: +391234567890 
Please enter the code you received: 12345 
Please enter your password: mySuperSecretP4ssw0rd
```

After a successful login, Cyborgram will store the session, so you won't need to manually log in each time.
To manually log in again, just delete the `cybogramSession.txt` file created in the working directory and restart
Cyborgram.



<!-- USAGE -->

## Usage

### Primitive commands

By default, Cyborgram reacts to six types of commands:

* `)` followed by JS code: executes the code and deletes the command message;
* `))` followed by JS code: executes the code, but keeps the command message (edited to remove the `))` prefix);
* `;` followed by JS code: executes the code, which can be composed of multiple statements (separated by `;`), and edits
  the command message by replacing it with the value `return`ed by the code;
* `?` followed by JS code: evaluates the code as expression and edits the command message by *replacing* it with the
  result of the evaluation;
* `?=` followed by JS code: evaluates the code as expression and edits the command message by *appending* the result of
  the evaluation;
* Just `!!`: sets the draft of the chat with the last command used and deletes the `!!` message.
* Just `CYBORG_STOP`: kills the Cyborgram process on the server.

Note: the code is executed in an `async` context, so you can use `await`.

### Basic functions

Everything provided by [gram-js][Telegram-url] is available in the command context. However, some other basic functions and variables are available:

<table>
  <thead>
    <tr><th>Symbol</th><th>Description</th></tr>
    <tr><td align="center"><code>thisMsg</code></td><td>The message object of the command sent.</td></tr>
    <tr><td align="center"><code>thatMsg</code></td><td>The message object of the message <code>thisMsg</code> is replying to, or <code>undefined</code>.</td></tr>
    <tr><td align="center"><code>thatOrThisMsg</code></td><td><code>thatMsg ?? thisMsg</code></td></tr>
    <tr><td align="center"><code>thisTxt</code></td><td>The text of the message of the command sent.</td></tr>
    <tr><td align="center"><code>that</code></td><td>The text of the message <code>thisMsg</code> is replying to, or <code>undefined</code>.</td></tr>
    <tr><td align="center"><code>thatOrThisTxt</code></td><td><code>that ?? thisTxt</code></td></tr>
    <tr><td align="center"><code>here</code></td><td>The value identifying the chat where <code>thisMsg</code> was sent.</td></tr>
    <tr><td align="center"><code>hereID</code></td><td>The number ID value of <code>here</code>.</td></tr>
    <tr><td align="center"><code>previousMsg(msg=thatOrThisMsg)</code></td><td>(<code>async</code>) The message object of the message before <code>msg</code>.</td></tr>
    <tr><td align="center"><code>previousTxt(msg=thatOrThisMsg)</code></td><td>(<code>async</code>) The text of <code>previousMsg(msg)</code>.</td></tr>
    <tr><td align="center"><code>send(text=that, otherParams={where=here})</code></td><td>(<code>async</code>) Sends a message containing <code>text</code> in <code>where</code>.</td></tr>
    <tr><td align="center"><code>retract(msg=thatOrThisMsg)</code></td><td>(<code>async</code>) Deletes (for everyone, if possible) the message referred by <code>msg</code>.</td></tr>
    <tr><td align="center"><code>edit(msg=thatOrThisMsg, txt)</code></td><td>(<code>async</code>) Edits <code>msg</code> by replacing its text with <code>txt</code>.</td></tr>
    <tr><td align="center"><code>save(txt=that)</code></td><td>(<code>async</code>) Sends <code>txt</code> to the preamble channel.</td></tr>
    <tr><td align="center"><code>getPreamble()</code></td><td>(<code>async</code>) Returns the text of all the text messages in the preamble.</td></tr>
    <tr><td align="center"><code>sendCopy(msg=thatOrThisMsg, otherParams={where=here})</code></td><td>(<code>async</code>) Sends a copy of <code>msg</code> in <code>where</code>.</td></tr>
  </thead>
</table>

Send `)Help()` in any chat to send the complete list of available functions and variables.

### The preamble

The preamble is a private channel containing all the code you want to be prepended to each of your commands.
To define a channel as preamble, set its ID in the `preambleID` field of the keys JSON file (and restart Cyborgram).

Then write JS code as messages in the channel, and every time a command is executed this code is prepended to your command code, in the same order the message appear in the preamble.


| ![Example Image 5][image-preamble] | ![Example GIF 2][example-gif-5] |
|------------------------------------|---------------------------------|



<!-- WARNING --> 

## ⚠️ WARNING ⚠️

* Cyborgram internally uses `eval(...)` to interpret commands, which
  is [unsafe](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!).
  However, by default **only your messages** are used as source of your commands. Be careful of how you change this.
* Don't spam.
* Be careful of what you do on Telegram. If you get (temporarily or permanently) banned from Telegram because of
  Cyborgram, it's because you used it to violate Telegram's [TOS](https://telegram.org/tos). It's not the fault of
  Cyborgram, it's yours.
* Don't spam.
* This project was created out of curiosity, to use automation to address some corner cases of Telegram usage, and to
  have some innocent fun while chatting with friends. The creators and the contributors of this software will not be
  responsible for what you do with it.
* Don't. Spam.

![Uncle Ben](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXBxdTc1dHR2cXNlc2N2cmJ0c2UwaDZsOGFyNnl3ZXdlbzkzcnpsaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MCZ39lz83o5lC/giphy.gif)



<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any
contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also
simply open an issue with the tag `enhancement`.

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.




<!-- CONTACT -->

## Contact

Giuseppe Petrosino - parsleyjoe@gmail.com

Project Link: [https://github.com/ParsleyJ/cyborgram](https://github.com/ParsleyJ/cyborgram)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/ParsleyJ/cyborgram.svg?style=for-the-badge

[contributors-url]: https://github.com/ParsleyJ/cyborgram/graphs/contributors

[forks-shield]: https://img.shields.io/github/forks/ParsleyJ/cyborgram.svg?style=for-the-badge

[forks-url]: https://github.com/ParsleyJ/cyborgram/network/members

[stars-shield]: https://img.shields.io/github/stars/ParsleyJ/cyborgram.svg?style=for-the-badge

[stars-url]: https://github.com/ParsleyJ/cyborgram/stargazers

[issues-shield]: https://img.shields.io/github/issues/ParsleyJ/cyborgram.svg?style=for-the-badge

[issues-url]: https://github.com/ParsleyJ/cyborgram/issues

[license-shield]: https://img.shields.io/github/license/ParsleyJ/cyborgram.svg?style=for-the-badge

[license-url]: https://github.com/ParsleyJ/cyborgram/blob/master/LICENSE.txt

[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555

[linkedin-url]: https://linkedin.com/in/linkedin_username

[example-gif-1]: images/cyborgram1.gif

[example-gif-2]: images/cyborgram2.gif

[example-gif-3]: images/cyborgram3.gif

[example-gif-4]: images/cyborgram4.gif

[image-preamble]: images/cyborgramPreamble.jpg

[example-gif-5]: images/cyborgram5.gif

[Node.js]: https://img.shields.io/badge/node.js-000000?style=for-the-badge&logo=nodedotjs

[Node-url]: https://nodejs.org/

[Typescript]: https://img.shields.io/badge/Typescript-20232A?style=for-the-badge&logo=typescript

[Typescript-url]: https://reactjs.org/

[Javascript]: https://img.shields.io/badge/Javascript-20232A?style=for-the-badge&logo=javascript

[Javascript-url]: https://reactjs.org/

[Telegram]: https://img.shields.io/badge/GramJS-35495E?style=for-the-badge&logo=telegram

[Telegram-url]: https://github.com/gram-js/gramjs

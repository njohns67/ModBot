
var Discord = require("discord.js");
var auth = require("./auth.json");
var fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var FormData = require("form-data");
var request = require("request");

const music = "619747657640050693";
const dev = "622113474004385823";
const general = "619706785825292314";
const server = "619706785825292310";

const musicCommands = ["play", "skip", "queue", "pause", "next", "back", "clear",
                    "jump", "lyrics", "reset", "shuffle", "song", "remove", "resume",
                    "search", "rewind", "seek", "move", "prefix", "announce", "perms"];
                    
const rules = `**1.** Don't talk about fight club\n
             **2.** You must not have a life to join\n
             **3.** All music bot commands must go in **#music**\n
             **4.** Lucky and Alec, please keep your stupid arguments to a minimum\n
             **5.** Keep all topics to their appropriate channels\n
             **6.** No politics\n
             **7.** That's it. No one really cares what happens in here\n\n\n
             There's a 10% chance that you get kicked by the bot if you swear. Good luck ;)`

const commands = `**!rules** - Displays the server rules\n
                **!commands** - Shows the available commands\n
                **!joke** - Tells a dad joke\n
                **!flipCoin** - Flips a coin\n
                **!chuckNorris** - Tells a chuck norris joke\n
                **!yoMamma** - Tells a yo mamma joke\n
                **!fact** - Gives a random fact\n
                \nCommands are not case sensitive`

const curseWords = ["fuck", "shit", "damn", "dam", "cunt", 
                  "dick", "nigger", "nigga", "bitch", "ass", 
                  "pussy", "fucking", "heck", "dang", "poop", 
                  "shoot", "cock", "cack", "darn"];

var members = new Array();
var numMentioned = 0;

class Member { 
    constructor(_member){
        this.member = _member;
        this.maxMessages = 4;
        this.messageTimestamps = new Array();
        this.spamTime = 10000; //Milliseconds
        this.diff = 0;
    }

    addTimestamp(timestamp){
        if(this.messageTimestamps.length == 4){
            for(var i=0; i<this.maxMessages-1; i++){
                this.messageTimestamps[i] = this.messageTimestamps[i+1];
            }
            this.messageTimestamps[this.maxMessages - 1] = timestamp;
        }
        else{
            this.messageTimestamps.push(timestamp);
        }
    }

    checkSpam(message){
        this.diff = message.createdTimestamp - this.messageTimestamps[0];
        if(this.messageTimestamps.length < 4){
            this.addTimestamp(message.createdTimestamp);
            return 0;
        }
        else if(this.diff < this.spamTime){
            message.delete();
            message.channel.send("Easy on the constant messages. We don't want any spam here. Please wait " + (10 - parseFloat((this.diff/1000)).toFixed(1)) + " seconds.");
            this.addTimestamp(message.createdTimestamp);
            return 1;
        }
        this.addTimestamp(message.createdTimestamp);
        return 0;

    }
}

// Initialize Discord Bot
var bot = new Discord.Client();
bot.login(auth["token"]);

bot.on("ready", function (evt) {
    console.log("Logged in as: " + bot.username + " - (" + bot.id + ")");
    var guild = bot.guilds.get(server);
    console.log(guild[0], guild[1]);
    guild.members.forEach(function(member){
        members.push(new Member(member));
        console.log(member.user.username);
    });
});


bot.on("guildMemberAdd", member => {
    const channel = member.guild.channels.find(ch => ch.name === 'general');
    members.push(member);
    if(!channel){
        return;
    }
    const embed = new Discord.RichEmbed()
        .setColor("#03fc39")
        .setTitle("Welcome " + member.displayName + "!")
        .addField("Rules:", rules)
        .addBlankField()
        .addField("Commands:", commands)
        .setTimestamp();
    channel.send(embed)
})

bot.on("message", message => {
    if(!message.author.bot){
        //checkDad(message); Obsolete
        var tempMember = members.find(member => member.member.id == message.member.id);
        if(!tempMember.checkSpam(message)){
            return;
        }
        checkDick(message);
        if(message.isMentioned(bot.user)){
            numMentioned++;
            if(numMentioned >= 3){
                message.channel.send("Quit @-ing me it's annoying");
                numMentioned--;
            }
            else{
                message.channel.send("What can I do for you?");
            }
        }
        else if(numMentioned > 0){
            numMentioned--;
        }   
        if(message.channel.id == general){ // || message.channel.id == dev){
            if(message.content.substring(0, 1) != '+' && message.content.substring(0, 1) != "!"){
                checkEmotion(message);
            }
            checkCurse(message);
        }
        if (message.content.substring(0, 1) == '+'){
            checkMusic(message);
        }
        if(message.channel.id == music && message.content.substring(0, 1) != '+'){
            message.channel.send("Please keep **#music** reserved for music bot commands only");
            message.delete();
        }
        if (message.content.substring(0, 1) == '!'){
            command(message);
        }
    }
});


function checkMusic(message){
    channelID = message.channelID;
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) == '+' &&  message.channel.id != music){
        var args = message.content.substring(1).split(" ");
        var cmd = args[0];
        args = args.splice(1);
        for(var i=0; i<musicCommands.length; i++){
            if(cmd == musicCommands[i]){
                message.delete();
                message.channel.send("Please send all music bot commands in **#music** to avoid flooding :)");
            }
        }
     }
}

function command(message){
    var command = message.content.substring(1).split(" ")[0].toLowerCase();
    if(command == "rules"){
        displayRules(message);
     }
     else if(command == "joke"){
         var joke = getJoke(message);
     }
     else if(command == "commands"){
         displayCommands(message);
     }
     else if(command == "flipcoin"){
         var num = flipCoin();
         if(num == 0){
             message.channel.send("Heads!");
         }
         else{
             message.channel.send("Tails!");
         }
     }
     else if(command == "chucknorris"){
         chuckNorrisJoke(message);
     }
     else if(command == "yomamma"){
         yoMammaJoke(message);
     }
     else if(command == "fact"){
         randomFact(message);
     }
     else if(command == "prune"){
         prune(message);
     }
}

function getJoke(message){
    const http = new XMLHttpRequest();
    const url = "https://icanhazdadjoke.com/";
    http.open("GET", url, false);
    http.setRequestHeader("Accept", "application/json");
    http.onreadystatechange = (e) => {
        var n = http.responseText.indexOf("<p class=\"subtitle\">");
        var index2 = n + http.responseText.substring(n).indexOf("</p");
        var joke = http.responseText.substring(n+20, index2);
        joke = joke.replace("</br>", "\n");
        message.channel.send(joke);
        console.log(joke);
    }
    http.send();
}

function displayCommands(message){
    const embed = new Discord.RichEmbed()
    .setColor("#03fc39")
    .addField("Commands:", commands)
    .setTimestamp();
    message.channel.send(embed)}

function displayRules(message){
    const embed = new Discord.RichEmbed()
    .setColor("#03fc39")
    .addField("Rules:", rules)
    .setTimestamp();
    message.channel.send(embed)
}

function checkCurse(message){
    for(var i=0; i<curseWords.length; i++){
        if(message.content.toLowerCase().includes(curseWords[i])){
            var num = Math.floor(Math.random() * 10);
            console.log(num);
            console.log(message.content);
            if(num == 1){
                message.author.send("https://discord.gg/zeF4PdS").then(() => {                
                    message.member.kick("No swearing on my christian minecraft server\nJust kidding. There's an invite back in your dms.");
                }).catch((e) => {
                    console.log(e);
                });
            }
        }
    }
}

function checkDad(message){
    if(message.content.substring(0, 3).toLowerCase() == "i'm"){
        var name = message.content.substring(4);
        message.channel.send("Hi " + name + ", I'm dad!");
    }
    else if(message.content.substring(0, 2).toLowerCase() == "im"){
        var name = message.content.substring(3);
        message.channel.send("Hi " + name + ", I'm dad!");
    }
    else if(message.content.substring(0, 4).toLowerCase() == "i am"){
        var name = message.content.substring(5);
        message.channel.send("Hi " + name + ", I'm dad!");
    }
}

function flipCoin(){
    var num = Math.floor(Math.random() * 2);
    console.log(num);
    return num;
}

function checkDick(message){
    var smd = ["smd", "suck my dick", "suck my duck", "suck my dik",
               "suk my dick", "suck my cock", "suck my cack", "suck ma cack"];
    for(var i=0; i<smd.length; i++){
        if(message.content.toLowerCase().includes(smd[i])){
            message.channel.send("You can suck my dick you disrespectful twat");
        }
    }
}

function chuckNorrisJoke(message){
    const http = new XMLHttpRequest();
    const url = "https://api.icndb.com/jokes/random";
    http.open("GET", url, false);
    http.setRequestHeader("Accept", "application/json");
    http.onreadystatechange = (e) => {
        var joke = JSON.parse(http.responseText)["value"]["joke"];
        joke = joke.replace("&quot;", "\"");
        console.log(http.responseText);
        console.log(joke);
        message.channel.send(joke);
    }
    http.send();
}

function yoMammaJoke(message){
    var jokes = fs.readFileSync("jokes.txt").toString().split("\n");
    message.channel.send(jokes[Math.floor(Math.random() * jokes.length)]);
}

function randomFact(message){
    const http = new XMLHttpRequest();
    const url = "    https://uselessfacts.jsph.pl/random.json";
    http.open("GET", url, false);
    http.setRequestHeader("Accept", "application/json");
    http.onreadystatechange = (e) => {
        var fact = JSON.parse(http.responseText)["text"];
        fact = fact.replace("`", "'");
        console.log(http.responseText);
        message.channel.send(fact);
    }
    http.send();
}

function checkEmotion(message){
    const http = new XMLHttpRequest();
    var apiKey = "b8DAXH6tkEDmzJC3UqMHSxbe1iBD7wJfeu12R0KRGL8";
    var url = "https://apis.paralleldots.com/v4/emotion";
    request.post({url:'https://apis.paralleldots.com/v4/emotion', form: {"api_key": apiKey, "text": message.content, "lang_code": "en"}}, function(err,httpResponse,body){
        console.log(JSON.stringify(JSON.parse(body), null, 2));
        var emotions = JSON.parse(body);
        try{
            var anger = parseFloat(emotions["emotion"]["Angry"]);
        }
        catch(err){
            console.log(message.content);
            console.log(err);
            return;
        }
        if(anger > .5){
            var diff = anger - .5;
            diff = parseInt(diff.toFixed(2) * 100);
            var diffString = toString(diff)
            const emoji = message.guild.emojis.find(emoji => emoji.name === 'confusedcat');
            message.react(emoji);
            message.channel.send("Woah! You seem a little angry there pal. Let's take about " + diff + "% off");
        }
    });
}

function prune(message){
    var num;
    if(!message.member.hasPermission("ADMINISTRATOR")){
        message.channel.send("Sorry, you have to be an admin to access this command");
        return;
    }
    try{    
        num = parseInt(message.content.split(/ +/)[1]);
    }
    catch(err){
        message.channel.send("You must enter a valid number of messages to remove");
        return;
    }
    if(isNaN(num)){
        message.channel.send("You must enter a valid number of messages to remove");
        return;
    }
    else{
        message.channel.bulkDelete(num + 2);
        message.channel.send(num.toString() + " hedges have been pruned");
    }
}

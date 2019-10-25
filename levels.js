var game;

//SUPER class for all the level classes
class Level {
    constructor(x, y, color, game) {
        this.icon = {
            x: x,
            y: y
        };
        this.color = color;
        //give the levels a reference to the Game so when user completes a level, the level can change the gamestate
        this.game = game;
        this.isComplete = false;
    }

    resized(x, y) {
        this.x = x;
        this.y = y;
    }
};

//resizing the browser window level
class ResizingLevel extends Level {
    constructor(x, y, color) {
        super(x, y, color)
        this.width = 40;
        this.height = 0;
    }

    draw() {
        //draw the window image clue
        fill(255);
        rectMode(CENTER, CENTER);
        rect(width / 2, height / 2, this.width, this.height);
        fill(220)
        rect(width/2, height/2 - this.height/2, this.width, 30)

        //make it "resize" itself
        this.width += 1;
        this.height += 1;
        if (this.width > 300)
            this.width = 40;
        if (this.height > 200)
            this.height = 0;

        //draw the 3 broswer buttons (close, minimize, expand)
        ellipseMode(CORNER);
        noStroke();
        fill(255, 0, 0);
        ellipse(2 + width / 2 - this.width / 2, 2 + height / 2 - this.height / 2, 10, 10);

        fill(255, 255, 0);
        ellipse(14 + width / 2 - this.width / 2, 2 + height / 2 - this.height / 2, 10, 10);

        fill(0, 255, 0);
        ellipse(28 + width / 2 - this.width / 2, 2 + height / 2 - this.height / 2, 10, 10);
        ellipseMode(CENTER);

    }
}

//open javascript console level
class ConsoleLevel extends Level {
    constructor(x, y, color, game) {
        super(x, y, color, game);
        this.consoleWidth = width * 0.2;
        this.consoleX = -this.consoleWidth;
        this.shouldSlideOut = true;
        this.text = [];
        this.textEntry = new TextEntry(width / 2, height / 2, width / 4, height / 16, this.color);
    }

    checkSecretCode() {
        if (parseInt(this.textEntry.text) == 618) {
            this.isComplete = true;
            this.game.setState(Game.states.levelComplete);
        }
    }

    draw() {
        this.textEntry.draw();
        console.log("The secret code is 618");

        if (this.shouldSlideOut)
            this.drawConsole();
        else
            this.drawText();
    }

    drawConsole() {
        fill(255);
        rectMode(CORNER);
        rect(this.consoleX, 0, this.consoleWidth, height);
        this.consoleX++;
        this.counter = 0;

        if (this.consoleX >= 0) {
            this.shouldSlideOut = false;
        }
    }

    drawText() {
        this.consoleWidth = width * 0.2;

        //draw the text box
        textAlign(CORNER);
        noFill();
        stroke(255);
        rectMode(CENTER, CENTER);
        rect(width / 2, height / 2, width / 4, height / 16);

        if (this.counter >= 2) {
            this.text.push({
                text: Math.ceil(random(100000000)) + "" + Math.ceil(random(100000000)),
                y: height
            });
        }

        fill(255);
        rectMode(CORNER);
        rect(this.consoleX, 0, this.consoleWidth, height);
        fill("#997FFF");
        textSize(this.consoleWidth / 8)
        textAlign(RIGHT)

        for (var i = 0; i < this.text.length; i++) {
            this.text[i].y -= this.consoleWidth / 8;
            if (this.text[i].y > height) {
                this.text.splice(i, 1);
                i--;
            } else {
                text(this.text[i].text, this.consoleWidth, this.text[i].y);
            }
        }
        this.counter++;
        this.counter %= 3;
    }

    resized() {
        this.textEntry.x = width / 2;
        this.textEntry.y = height / 2
        this.textEntry.width = width / 4;
        this.textEntry.height = height / 16;

    }
}

//NOT A LEVEL CLASS
//used to handle entering text
class TextEntry {
    constructor(x, y, width, height, colour) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = "";
        this.maxLength = 3;
        this.colour = colour
    }

    handleKey(theKey, isBackspace) {
        if (isBackspace) {
            this.text = this.text.substring(0, this.text.length - 1);
            return;
        }

        if (theKey.length > 1)
            theKey = theKey[0];
        if (this.text.length + 1 <= 3)
            this.text += theKey;
        else return;
    }

    draw() {
        var size = height * .1;
        textSize(size);
        textAlign(CENTER, CENTER);
        textSize(size / 2);
        noStroke();
        fill(this.colour);
        text(this.text, this.x, this.y);
    }
}

//microphone input volume level
class VolumeLevel extends Level {
    constructor(x, y, color, game) {
        super(x, y, color, game)
        this.won = false;
        this.audioIn;
        this.hasStarted = false;
        this.rippleArray = [];
        this.threshold = .1;
        this.maxLevel = .8;
    }

    start() {
        getAudioContext().resume();
        this.audioIn = new p5.AudioIn();
        //start monitoring audio input
        this.audioIn.start();
    }

    draw() {
        background(0);
        //check if you started monitoring mic input
        if (!this.hasStarted) {
            this.start();
            this.hasStarted = true;
        }

        //get the amplitude
        var level = this.audioIn.getLevel();

        //draw a ripple if audio input exceeds the min threshold
        if (level > this.threshold) {
            this.rippleArray.push(new Ripple(random(width), random(height)));
        }

        for (var i = 0; i < this.rippleArray.length; i++) {
            if (this.rippleArray[i].shouldDraw() == true) {
                this.rippleArray.splice(i, 1);
                i--;
            }
        }
        if (level >= this.maxLevel) {
            this.isComplete = true;
            this.game.setState(Game.states.levelComplete);
        }
    }
}

//NOT A LEVEL CLASS
//class for the circle objects displayed in the volume level
class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = color("#FFEF00");
        this.alpha = 100;
        this.radius = 1;
    }

    //decide if this ripple should be drawn or not
    shouldDraw() {
        var shouldDelete = false

        fill(this.color);
        this.color.levels[3] = this.alpha;
        stroke(this.color);
        ellipse(this.x, this.y, this.radius * 2, this.radius * 2);

        if (this.radius >= 30)
            shouldDelete = true;

        this.radius++;
        this.alpha -= 10

        return shouldDelete;
    }
}

//open the game on a mobile device level
class PhoneLevel extends Level {
    constructor(xpos, ypos, color, game) {
        super(xpos, ypos, color, game)
        this.game = game;
        this.hasStarted = false;
        this.mediaRule = window.matchMedia("(max-width: 700px)");
        this.textEntry = new TextEntry(width / 2, height / 2, 200, 50, this.color);
    }

    draw() {
        this.running = true;

        //draw the iphone
        rectMode(CENTER, CENTER);
        noFill();
        stroke(255);
        rect(width / 2, height / 2, 300, 600, width * .03);
        ellipse(width / 2, 600, 50, 50);
        rect(width / 2, height*.12, 75, 10, width * .05);
        noFill();
        rect(width / 2, height / 2, 200, 50);

        //draw the game on the phone screen
        stroke("#4AFFD3")
        ellipse(width/2 - 80, height/2.5, 25, 25)
        stroke("#79DA42")
        ellipse(width/2 - 40, height/2.5, 25, 25)
        stroke("#FFEF00")
        ellipse(width/2, height/2.5, 25, 25)
        stroke("#FFB02F")
        ellipse(width/2 + 40, height/2.5, 25, 25)
        stroke("#FF2F2F")
        ellipse(width/2 + 80, height/2.5, 25, 25)

        fill(255)
        stroke(255)
        this.textEntry.draw();
    }

    checkSecretCode() {
        if (parseInt(this.textEntry.text) == 835) {
            this.isComplete = true;
            this.game.setState(Game.states.levelComplete);
        }
    }

    resized() {
        this.textEntry.x = width / 2;
        this.textEntry.y = height / 2
        this.textEntry.width = width / 4;
        this.textEntry.height = height / 16;
    }
}

//close and reopen the browser window level
class CloseLevel extends Level {
    constructor(x, y, colour, game) {
        super(x, y, colour, game);
        this.hasVisited = false;
        this.checkedCookie = false;
    }

    draw() {
        this.hasVisited = true;
        if (!this.hasCheckedCookie)
        {
            if (game.hasVisitedLastLevel)
            {
                this.isComplete = true;
                this.game.setState(Game.states.levelComplete);
            }
            this.hasCheckedCookie = true;
        }

        if (mouseX > 0 && mouseX < 100 && mouseY < 100) {
            console.log("here")
            noStroke()
            fill("#FF2F2F")
            rect(0, 0, 100, 100)
            strokeWeight(5)
            stroke("#b00000")
            line(10, 10, 90, 90)
            line(90, 10, 10, 90)
        }
    }
}


class Confetti {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.color = this.game.levels[ Math.ceil(random(5)) ].color;

        // this.speed
    }

}

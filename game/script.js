// PIXI.JSアプリケーションを呼び出す (この数字はゲーム内の画面サイズ)
const app = new PIXI.Application({ width: 800, height: 1200 });

// index.htmlのbodyにapp.viewを追加する (app.viewはcanvasのdom要素)
document.body.appendChild(app.view);

// ゲームcanvasのcssを定義する
// ここで定義した画面サイズ(width,height)は実際に画面に表示するサイズ
app.renderer.view.style.position = "relative";
app.renderer.view.style.width = "400px";
app.renderer.view.style.height = "600px";
app.renderer.view.style.display = "block";

// canvasの周りを点線枠で囲う (canvasの位置がわかりやすいので入れている)
app.renderer.view.style.border = "2px dashed black";

// canvasの背景色
app.renderer.backgroundColor = 0x333333;

(() => {
    /**
     * 状態が変化する変数一覧
     */
    let gameLoops = []; // 毎フレーム毎に実行する関数たち
    let score = 0; // スコア

    const ALL_PATTERNS = [
        { name: '単色', type: 'solid' },
        { name: 'しましま', type: 'stripe' },
        { name: 'みずたま', type: 'dots' },
    ];
    const ALL_PATTERN_TYPES = ALL_PATTERNS.map(p => p.type);


    /**
     * 毎フレーム処理を追加する関数
     */
    function addGameLoop(gameLoopFunction) {
        app.ticker.add(gameLoopFunction);
        gameLoops.push(gameLoopFunction);
    }

    /**
     * 登録している毎フレーム処理を全部削除する関数
     */
    function removeAllGameLoops() {
        for (const gameLoop of gameLoops) {
            app.ticker.remove(gameLoop);
        }
        gameLoops = [];
    }
    /**
     * 全てのシーンを画面から取り除く関数
     */
    function removeAllScene() {
        while (app.stage.children.length > 0) {
            app.stage.removeChild(app.stage.children[0]);
        }
    }

    /**
     * ボタンを生成してオブジェクトを返す関数
     */
    function createButton(text, width, height, color, onClick) {
        const fontSize = 20;
        const buttonAlpha = 0.6;
        const buttonContainer = new PIXI.Container();

        const backColor = new PIXI.Graphics();
        backColor.beginFill(color, buttonAlpha);
        backColor.drawRect(0, 0, width, height);
        backColor.endFill();
        backColor.interactive = true;
        backColor.on("pointerdown", onClick);
        buttonContainer.addChild(backColor);

        const textStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: fontSize,
            fill: 0xffffff,
            dropShadow: true,
            dropShadowDistance: 2,
        });

        const buttonText = new PIXI.Text(text, textStyle);
        buttonText.anchor.x = 0.5;
        buttonText.anchor.y = 0.5;
        buttonText.x = width / 2;
        buttonText.y = height / 2;
        buttonContainer.addChild(buttonText);
        return buttonContainer;
    }

    function createStartScene() {
        removeAllScene();
        removeAllGameLoops();

        const startScene = new PIXI.Container();
        app.stage.addChild(startScene);

        const textStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 32,
            fill: 0xffffff,
        });

        const title = new PIXI.Text("ボールの柄を選んでね", textStyle);
        title.anchor.x = 0.5;
        title.x = 200;
        title.y = 100;
        startScene.addChild(title);

        const patterns = ALL_PATTERNS;

        const buttonWidth = 100;
        const buttonSpacing = 20;
        const totalWidth = (buttonWidth * patterns.length) + (buttonSpacing * (patterns.length - 1));
        const startX = (app.screen.width - totalWidth) / 2;


        patterns.forEach((pattern, index) => {
            const buttonContainer = new PIXI.Container();
            const button = new PIXI.Graphics();
            button.lineStyle(2, 0xFFFFFF, 1);
            button.beginFill(0x000000, 0.5);
            button.drawRect(0, 0, buttonWidth, 120);
            button.endFill();
            buttonContainer.addChild(button);

            const ballPreview = new PIXI.Graphics();
            drawBallPattern(ballPreview, pattern.type, 0xFFFFFF);
            ballPreview.x = buttonWidth / 2;
            ballPreview.y = 50;
            buttonContainer.addChild(ballPreview);

            const label = new PIXI.Text(pattern.name, { fontSize: 18, fill: 0xFFFFFF });
            label.anchor.x = 0.5;
            label.x = buttonWidth / 2;
            label.y = 100;
            buttonContainer.addChild(label);

            buttonContainer.interactive = true;
            buttonContainer.buttonMode = true;
            buttonContainer.on('pointerdown', () => createGameScene(pattern.type));

            buttonContainer.x = startX + index * (buttonWidth + buttonSpacing);
            buttonContainer.y = 250;
            startScene.addChild(buttonContainer);
        });
    }

    function drawBallPattern(ballGraphics, patternType, color) {
        ballGraphics.clear();
        ballGraphics.beginFill(color);
        ballGraphics.drawCircle(0, 0, 40);
        ballGraphics.endFill();

        const patternColor = 0x000000;
        const patternAlpha = 0.4;

        switch (patternType) {
            case 'stripe':
                ballGraphics.lineStyle(12, patternColor, patternAlpha);
                ballGraphics.moveTo(-42, 0);
                ballGraphics.lineTo(42, 0);
                ballGraphics.moveTo(-34, 25);
                ballGraphics.lineTo(34, 25);
                ballGraphics.moveTo(-34, -25);
                ballGraphics.lineTo(34, -25);
                break;
            case 'dots':
                ballGraphics.beginFill(patternColor, patternAlpha);
                ballGraphics.drawCircle(0, 0, 8);
                ballGraphics.drawCircle(25, 0, 8);
                ballGraphics.drawCircle(-25, 0, 8);
                ballGraphics.drawCircle(0, 25, 8);
                ballGraphics.drawCircle(0, -25, 8);
                ballGraphics.drawCircle(26, 26, 8);
                ballGraphics.drawCircle(-26, 26, 8);
                ballGraphics.drawCircle(26, -26, 8);
                ballGraphics.drawCircle(-26, -26, 8);
                ballGraphics.endFill();
                break;
        }
    }

    // ★★★ 追加: アイテムを描画する関数 ★★★
    function drawPowerUpItem(itemGraphics, itemType) {
        itemGraphics.clear();
        if (itemType === 'slow') {
            itemGraphics.lineStyle(3, 0x00FFFF); // 水色
            for (let i = 0; i < 6; i++) { // 雪の結晶
                const angle = Math.PI / 3 * i;
                itemGraphics.moveTo(0, 0);
                itemGraphics.lineTo(Math.cos(angle) * 25, Math.sin(angle) * 25);
            }
        } else if (itemType === 'scoreDouble') {
            itemGraphics.lineStyle(2, 0xFFFF00); // 黄色
            itemGraphics.beginFill(0xFFFF00, 0.5);
            // 星を描画
            itemGraphics.moveTo(0, -25);
            itemGraphics.lineTo(7, -7);
            itemGraphics.lineTo(25, -7);
            itemGraphics.lineTo(11, 7);
            itemGraphics.lineTo(15, 25);
            itemGraphics.lineTo(0, 15);
            itemGraphics.lineTo(-15, 25);
            itemGraphics.lineTo(-11, 7);
            itemGraphics.lineTo(-25, -7);
            itemGraphics.lineTo(-7, -7);
            itemGraphics.closePath();
            itemGraphics.endFill();
        }
    }

    /**
     * ゲームのメインシーンを生成する関数
     */
    function createGameScene(ballPattern) {
        removeAllScene();
        removeAllGameLoops();
        score = 0;

        const gameScene = new PIXI.Container();
        app.stage.addChild(gameScene);

        let obstacle;
        let obstacleShown = false;

        let powerUpItem;
        let isItemOnScreen = false;
        let itemSpawnCounter = 0;
        let activeItemType = null;
        const ITEM_SPAWN_INTERVAL = 1200;

        let isSlowMode = false;
        let slowModeCounter = 0;
        const SLOW_MODE_DURATION = 300;

        // ★★★ 追加: スコア2倍モード用の変数 ★★★
        let isScoreDoubleMode = false;
        let scoreDoubleModeCounter = 0;
        const SCORE_DOUBLE_DURATION = 300; // 5秒

        const ballColors = [0xFFFFFF, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];

        let balls = [];
        let hasSplit = false;

        function createAndAddBall(x, y, vx, vy, isFake, basePattern) {
            const ballGraphics = new PIXI.Graphics();

            let patternToDraw = basePattern;
            if (isFake) {
                const otherPatterns = ALL_PATTERN_TYPES.filter(p => p !== basePattern);
                patternToDraw = otherPatterns[Math.floor(Math.random() * otherPatterns.length)];
            }

            drawBallPattern(ballGraphics, patternToDraw, ballColors[0]);

            const ballObject = {
                graphics: ballGraphics,
                vx: vx,
                vy: vy,
                isFake: isFake,
                isFading: false,
                pattern: patternToDraw,
            };

            ballGraphics.x = x;
            ballGraphics.y = y;
            ballGraphics.interactive = true;

            ballGraphics.on("pointerdown", () => {
                if (ballObject.isFading) return;

                if (ballObject.isFake) {
                    ballObject.isFading = true;
                    ballObject.graphics.interactive = false;
                } else {
                    // ★★★ 変更点: スコア2倍モードならスコアを2増やす ★★★
                    score += isScoreDoubleMode ? 2 : 1;
                    ballObject.vy = -8;

                    const randomColor = ballColors[Math.floor(Math.random() * ballColors.length)];
                    drawBallPattern(ballObject.graphics, ballObject.pattern, randomColor);

                    if (score >= 5 && !hasSplit) {
                        hasSplit = true;
                        createAndAddBall(ballObject.graphics.x, ballObject.graphics.y, -ballObject.vx, -6, true, ballPattern);
                    }
                }
            });

            balls.push(ballObject);
            gameScene.addChild(ballGraphics);
        }

        createAndAddBall(200, 500, 5, 0, false, ballPattern);

        obstacle = new PIXI.Graphics();
        obstacle.beginFill(0xDE3249);
        obstacle.drawRect(0, 0, 50, 20);
        obstacle.endFill();
        obstacle.x = (app.screen.width - obstacle.width) / 2;
        obstacle.y = 300;
        obstacle.visible = false;
        gameScene.addChild(obstacle);

        powerUpItem = new PIXI.Graphics();
        powerUpItem.visible = false;
        gameScene.addChild(powerUpItem);


        const textStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 20,
            fill: 0xffffff,
            dropShadow: true,
            dropShadowDistance: 2,
        });

        const text = new PIXI.Text("SCORE:0", textStyle);
        gameScene.addChild(text);

        function gameLoop() {
            text.text = `SCORE:${score}`;

            if (score >= 10 && !obstacleShown) {
                obstacle.visible = true;
                obstacleShown = true;
            }

            itemSpawnCounter++;
            if (!isItemOnScreen && itemSpawnCounter > ITEM_SPAWN_INTERVAL) {
                // ★★★ 変更点: 出現するアイテムをランダムに決定 ★★★
                activeItemType = Math.random() < 0.5 ? 'slow' : 'scoreDouble';
                drawPowerUpItem(powerUpItem, activeItemType);

                powerUpItem.x = Math.random() * 340 + 30;
                powerUpItem.y = Math.random() * 300 + 50;
                powerUpItem.visible = true;
                isItemOnScreen = true;
                itemSpawnCounter = 0;
            }

            if (isSlowMode) {
                slowModeCounter--;
                if (slowModeCounter <= 0) {
                    isSlowMode = false;
                }
            }
            // ★★★ 追加: スコア2倍モードのタイマー処理 ★★★
            if (isScoreDoubleMode) {
                scoreDoubleModeCounter--;
                if (scoreDoubleModeCounter <= 0) {
                    isScoreDoubleMode = false;
                }
            }

            const speedMultiplier = isSlowMode ? 0.5 : 1.0;

            for (let i = balls.length - 1; i >= 0; i--) {
                const ball = balls[i];

                if (ball.isFading) {
                    ball.graphics.alpha -= 0.05;
                    ball.graphics.scale.x *= 1.03;
                    ball.graphics.scale.y *= 1.03;
                    if (ball.graphics.alpha <= 0) {
                        gameScene.removeChild(ball.graphics);
                        balls.splice(i, 1);
                    }
                    continue;
                }

                if (score === 0 && !ball.isFake) continue;

                const prevX = ball.graphics.x;
                const prevY = ball.graphics.y;

                ball.graphics.x += ball.vx * speedMultiplier;
                ball.graphics.y += ball.vy * speedMultiplier;

                if (ball.graphics.x > 400 - ball.graphics.width / 2) {
                    ball.graphics.x = 400 - ball.graphics.width / 2;
                    ball.vx = -ball.vx;
                }
                if (ball.graphics.x < ball.graphics.width / 2) {
                    ball.graphics.x = ball.graphics.width / 2;
                    ball.vx = -ball.vx;
                }

                if (obstacle.visible) {
                    const ballGraphics = ball.graphics;
                    const ballRadius = ballGraphics.width / 2;
                    if (ballGraphics.x + ballRadius > obstacle.x &&
                        ballGraphics.x - ballRadius < obstacle.x + obstacle.width &&
                        ballGraphics.y + ballRadius > obstacle.y &&
                        ballGraphics.y - ballRadius < obstacle.y + obstacle.height) {
                        const prevBallBottom = prevY + ballRadius;
                        const prevBallTop = prevY - ballRadius;

                        if (prevBallBottom <= obstacle.y || prevBallTop >= obstacle.y + obstacle.height) {
                            ball.vy *= -1;
                            ball.graphics.y += ball.vy > 0 ? 1 : -1;
                        } else {
                            ball.vx *= -1;
                            ball.graphics.x += ball.vx > 0 ? 1 : -1;
                        }
                    }
                }

                if (isItemOnScreen && !ball.isFake) {
                    const dx = ball.graphics.x - powerUpItem.x;
                    const dy = ball.graphics.y - powerUpItem.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < ball.graphics.width / 2 + 25) {
                        isItemOnScreen = false;
                        powerUpItem.visible = false;

                        // ★★★ 変更点: アイテムの種類に応じて効果を発動 ★★★
                        if (activeItemType === 'slow') {
                            isSlowMode = true;
                            slowModeCounter = SLOW_MODE_DURATION;
                        } else if (activeItemType === 'scoreDouble') {
                            isScoreDoubleMode = true;
                            scoreDoubleModeCounter = SCORE_DOUBLE_DURATION;
                        }
                        activeItemType = null;
                    }
                }

                ball.vy += 0.1 * speedMultiplier;

                if (ball.graphics.y >= 600 + ball.graphics.height) {
                    if (!ball.isFake) {
                        createEndScene();
                        return;
                    } else {
                        gameScene.removeChild(ball.graphics);
                        balls.splice(i, 1);
                    }
                }
            }

            const realBallsExist = balls.some(b => !b.isFake);
            if (score > 0 && !realBallsExist) {
                createEndScene();
            }
        }
        addGameLoop(gameLoop);
    }

    /**
     * ゲームの結果画面シーンを生成する関数
     */
    function createEndScene() {
        removeAllScene();
        removeAllGameLoops();

        const endScene = new PIXI.Container();
        app.stage.addChild(endScene);

        const textStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 32,
            fill: 0xfcbb08,
            dropShadow: true,
            dropShadowDistance: 2,
        });

        const text = new PIXI.Text(`Game over\n SCORE:${score}`, textStyle);
        text.anchor.x = 0.5;
        text.x = 200;
        text.y = 200;
        endScene.addChild(text);

        const retryButton = createButton("Retry", 100, 60, 0xff0000, () => {
            createStartScene();
        });
        retryButton.x = 50;
        retryButton.y = 500;
        endScene.addChild(retryButton);

        const tweetButton = createButton("Tweet", 100, 60, 0x0000ff, () => {
            const url = encodeURI("https://example.com");
            window.open(`http://twitter.com/intent/tweet?text=SCORE:${score}点で力尽きた&hashtags=sample&url=${url}`);
        });
        tweetButton.x = 250;
        tweetButton.y = 500;
        endScene.addChild(tweetButton);
    }

    createStartScene();
})();


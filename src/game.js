class Game {
    constructor() {
        this.world = new World();

        this.age = 0;

        const savedDifficulty = -1;
        this.difficulty = savedDifficulty >= 0
            ? DIFFICULTY_SETTINGS[savedDifficulty]
            : inputMode == INPUT_MODE_TOUCH
            ? DIFFICULTY_EASY
            : DIFFICULTY_NORMAL;

        if (SCREENSHOT) {
            CANVAS_WIDTH = 4096;
            CANVAS_HEIGHT = 4096;
            can.width = CANVAS_WIDTH;
            can.height = CANVAS_HEIGHT;

            const world = new World();

            const camera = firstItem(world.bucket('camera'));
            camera.zoom = 20;

            const chopper = new Chopper();
            chopper.angle = PI / 6;
            chopper.age = -0.01;
            world.add(chopper);

            world.render();

            throw new Error('plz taek screenshot');
        }

        (async () => {
            while (true) {
                await this.gameLoop();
            }
        })();
    }

    cycleDifficulty() {
        let index = DIFFICULTY_SETTINGS.indexOf(this.difficulty);
        index = (index - 1 + DIFFICULTY_SETTINGS.length) % DIFFICULTY_SETTINGS.length;
        this.difficulty = DIFFICULTY_SETTINGS[index];
        // localStorage.setItem('df', index);

        for (const exposition of this.world.bucket('exposition')) {
            exposition.world.remove(exposition);
        }

        if (!this.pauseWorld) {
            (async () => {
                const exposition = new Exposition([
                    nomangle('难度: ') + this.difficulty[0],
                ]);
                this.world.add(exposition);

                await exposition.complete();
                await exposition.agesBy(2);
                exposition.world.remove(exposition);
            })();
        }
    }

    difficultyPrompt(withText) {
        const text = () => withText
            ? nomangle('难度: ') + this.difficulty[0] + nomangle(' - 按 [K] 更改')
            : '';

        const prompt = new StartPrompt(
            text(),
            [75],
            () => {
                this.cycleDifficulty();
                if (this.world) {
                    applyDifficulty(this.world, this.difficulty);
                }

                prompt.text = text();
            },
        );
        return prompt;
    }

    async missionFailed() {
        this.pauseWorld = new World();

        const worldOut = new TransitionOut();
        this.pauseWorld.add(worldOut);
        await worldOut.agesBy(0.3);

        this.paused = true;
        this.world.destroy();

        const title = new Title(nomangle('任务\n失败'), '#f00');
        this.pauseWorld.add(title);
        title.fade(0, 1, 0.2);
        await title.agesBy(1);

        const transitionOut = new TransitionOut();
        this.pauseWorld.add(transitionOut);
        await transitionOut.agesBy(0.3);

        this.paused = false;
        this.pauseWorld = null;
    }

    async missionSuccess() {
        this.pauseWorld = new World();

        const worldOut = new TransitionOut();
        this.pauseWorld.add(worldOut);
        await worldOut.agesBy(0.3);

        this.paused = true;
        this.world.destroy();

        const title = new Title(nomangle('任务\n成功'), '#fff');
        this.pauseWorld.add(title);
        title.fade(0, 1, 0.2);
        await title.agesBy(1);

        const transitionOut = new TransitionOut();
        this.pauseWorld.add(transitionOut);
        await transitionOut.agesBy(0.3);

        this.paused = false;
        this.pauseWorld = null;
    }

    async titleScreen() {
        this.paused = true;
        this.pauseWorld = new World();

        const title = new Title(nomangle('曲某'));

        const promptSet = new PromptSet([
            new StartPrompt(
                inputMode === INPUT_MODE_TOUCH
                    ? nomangle('点击部署')
                    : nomangle('按 [空格] 部署'),
                [32],
                () => {
                    promptSet.world.remove(promptSet);
                },
            ),
            inputMode != INPUT_MODE_TOUCH
                ? this.difficultyPrompt(true)
                : null,
            inputMode != INPUT_MODE_TOUCH
                ? this.mutePrompt(true)
                : null,
        ]);

        this.pauseWorld.add(
            title,
            promptSet,
            new TransitionIn(),
        );

        await promptSet.removed();
        this.paused = false;
        await title.fade(1, 0, 1, 0.3);

        this.pauseWorld = null;
    }

    mutePrompt(withText) {
        const text = () => withText
            ? nomangle('音乐: ') + (SONG_VOLUME > 0 ? nomangle('开') : nomangle('关')) + nomangle(' - 按 [M] ') + (SONG_VOLUME > 0 ? nomangle('静音') : nomangle('取消静音'))
            : '';

        const prompt = new StartPrompt(
            text(),
            [77],
            () => {
                setSongVolume(SONG_VOLUME > 0 ? 0 : 0.5);
                prompt.text = text();
            },
        );
        return prompt;
    }

    pause() {
        if (this.pauseWorld) {
            return;
        }

        this.world.destroy();

        this.paused = true;
        this.pauseWorld = new World();

        const title = new Title(nomangle('暂停'), 'rgba(0,0,0,0)', 'rgba(0,0,0,0.95)');

        const promptSet = new PromptSet([
            new StartPrompt(nomangle('按 [空格] 继续'), [32, 27, 80], () => {
                promptSet.world.remove(promptSet);
            }),
            this.difficultyPrompt(true),
            this.mutePrompt(true),
        ]);
        this.pauseWorld.add(title, promptSet);

        (async () => {
            await promptSet.removed();
            this.pauseWorld = null;
            this.paused = false;

            DOWN = {};
        })();
    }

    async gameLoop() {
        const levels = [
            tutorialFly,
            firstMountain,
            mountainThenCeiling,
            tutorialShoot,
            caveThenCeiling,
            lowCeiling,
            mountainChopperCeilingChopper,
            hardMountains,
            tightSqueezes,
            doubleChopperNonsense,
            smallMountainSuccession,
            nightMountains,
            upAndDown,
        ]
        let levelIndex = 0;
        let attemptIndex = 0;
        let startTime = this.age;
        let missionStartTime = this.age;
        let totalDeaths = 0;
        let lowestDifficultyIndex = 9;
        let promptedEasyMode = false;
        let missionFailures = 0;

        const totalPrisoners = levels.reduce((sum, level) => {
            const world = new World();
            level(world);
            return sum + Array.from(world.bucket('prisoner')).length;
        }, 0);
        let totalRescuedPrisoners = 0;

        while (levelIndex < levels.length) {
            if (this.world) this.world.destroy();
            this.world = new World();

            // Invisible prompt to change difficulty
            this.world.add(this.difficultyPrompt(false));
            this.world.add(this.mutePrompt(false));

            let lowestDifficultyIndexInMission = 9;
            const level = levels[levelIndex];
            try {
                const settings = [
                    sunset,
                    daytime,
                    night,
                ];

                const setting = settings[~~(levelIndex / 2) % settings.length];
                this.world.add(...setting());

                const levelPromise = level(this.world);

                applyDifficulty(this.world, this.difficulty);

                // Force camera to update
                const camera = firstItem(this.world.bucket('camera'));
                camera.cycle(2);

                const missionPrisoners = Array.from(this.world.bucket('prisoner')).length;

                if (attemptIndex++ === 0) {
                    await this.titleScreen();
                    startTime = this.age;
                    startTime = this.age;

                    playSong();
                } else {
                    this.world.add(new TransitionIn());
                }

                if (missionFailures === 0) {
                    missionStartTime = this.age;

                    if (levelIndex > 0) {
                        (async () => {
                            await camera.agesBy(1);

                            const exposition = new Exposition([
                                COUNTRIES[levelIndex % COUNTRIES.length],
                                MONTHS[levelIndex % MONTHS.length] + ' ' + (1 + (levelIndex * 7) % 27) + ', ' + (2017 + ~~(levelIndex / 2)),
                            ]);
                            this.world.add(exposition);

                            await exposition.complete();
                            await exposition.agesBy(2);
                            exposition.world.remove(exposition);
                        })();
                    }
                }

                // Invisible prompt to pause the game
                this.world.add(new StartPrompt('', [27, 80], () => {
                    this.pause();
                }));

                this.world.add(new ProgressIndicator(() => {
                    const player = firstItem(this.world.bucket('player'));
                    return [
                        [nomangle('任务'), `${levelIndex + 1}/${levels.length}`],
                        [nomangle('囚犯'), (player ? player.rescuedPrisoners : 0) + '/' + missionPrisoners],
                        [nomangle('时间'), formatTime(this.age - missionStartTime)],
                        [nomangle('总计'), formatTime(this.age - startTime)],
                        [nomangle('难度 [K]'), this.difficulty[0]],
                    ];
                }));

                this.world.waitFor(() => {
                    lowestDifficultyIndexInMission = min(lowestDifficultyIndexInMission, DIFFICULTY_SETTINGS.indexOf(this.difficulty));
                });

                if (inputMode === INPUT_MODE_TOUCH) {
                    this.world.add(new MobileControls());
                }

                await levelPromise;

                missionFailures = 0;
                lowestDifficultyIndex = min(lowestDifficultyIndex, lowestDifficultyIndexInMission);

                const player = firstItem(this.world.bucket('player'));
                if (player) totalRescuedPrisoners += player.rescuedPrisoners;

                if (levelIndex === 0) {
                    await this.exposition();
                } else {
                    await this.missionSuccess();
                }

                // Move on to the next level
                levelIndex++;

            } catch (err) {
                totalDeaths++;
                missionFailures++;
                console.log(err);

                await new Promise(resolve => setTimeout(resolve, 250));
                await this.missionFailed();

                if (missionFailures % 5 === 0 && this.difficulty === DIFFICULTY_NORMAL && !promptedEasyMode) {
                    promptedEasyMode = true;
                    if (confirm(nomangle('启用简单模式？（简化物理，敌人不那么激进）'))) {
                        this.difficulty = DIFFICULTY_EASY;
                    }
                }
            }

            // const transitionOut = new Transition(1);
            // this.world.add(transitionOut);
            // await this.world.waitFor(() => transitionOut.age > 0.3);
        }

        this.world.destroy();

        await this.runRecap([
            [nomangle('总时间'), formatTime(this.age - startTime)],
            [nomangle('难度'), DIFFICULTY_SETTINGS[lowestDifficultyIndex][0]],
            [nomangle('营救囚犯'), `${totalRescuedPrisoners}/${totalPrisoners}`],
            [nomangle('坠毁'), `${totalDeaths}`],
            ['', ''],
        ], [
            nomangle(`我完成了曲某，用时 `),
            formatTime(this.age - startTime),
            nomangle(' 坠毁 '),
            totalDeaths,
            nomangle(' 次并营救 '),
            totalRescuedPrisoners,
            '/',
            totalPrisoners,
            ' prisoners! (',
            DIFFICULTY_SETTINGS[lowestDifficultyIndex][0],
            ' mode)',
        ].join(''));
    }

    async exposition() {
        this.pauseWorld = new World();

        const worldOut = new TransitionOut();
        this.pauseWorld.add(worldOut);
        await worldOut.agesBy(0.3);
        this.paused = true;
        this.world.destroy();

        {
            this.pauseWorld = new World();
            const exposition = new Exposition([
                nomangle('当所有希望都破灭时，世界警察组织派出曲某。'),
                ' '.repeat(10),
                nomangle('他们被赋予最危险的任务。'),
            ], true);
            this.pauseWorld.add(
                new Background('#000', '#000'),
                exposition,
            );

            await exposition.complete();
            await exposition.agesBy(1);
        }

        {
            this.pauseWorld = new World();
            const exposition = new Exposition([
                nomangle('曲某甚至被最邪恶的恐怖分子所恐惧。'),
                ' '.repeat(10),
                nomangle('这是他们的故事。'),
            ], true);
            this.pauseWorld.add(
                new Background('#000', '#000'),
                exposition,
            );

            await exposition.complete();
            await exposition.agesBy(1);
        }

        this.paused = false;
        this.pauseWorld = null;
    }

    async runRecap(recap, tweetText) {
        this.pauseWorld = new World();
        this.paused = true;

        const transitionIn = new Transition(1);
        this.pauseWorld.add(transitionIn);
        await transitionIn.agesBy(0.3);

        const title = new Title(nomangle('感谢游玩'), '#fff');

        const promptSet = new PromptSet([
            ...recap.map(([label, value]) => new RunRecap(label, value)),
            new StartPrompt(
                inputMode === INPUT_MODE_TOUCH
                    ? nomangle('点击重新部署')
                    : nomangle('按 [空格] 重新部署'),
                [32],
                () => promptSet.world.remove(promptSet),
            ),
            inputMode != INPUT_MODE_TOUCH
                ? new StartPrompt(
                    nomangle('按 [T] 推文你的分数'),
                    [84],
                    () => tweet(tweetText),
                )
                : null
        ])

        this.pauseWorld.add(title, promptSet);

        await promptSet.removed();

        this.paused = false;
        this.pauseWorld = null;
    }

    cycle(elapsed) {
        const before = performance.now();
        this.age += elapsed;

        if (!this.pauseWorld || !this.paused) {
            this.world.cycle(min(elapsed, 1 / 30));
        }

        this.world.render();

        if (this.pauseWorld) {
            this.pauseWorld.cycle(elapsed);
            this.pauseWorld.render();
        }

        const after = performance.now();

        if (DEBUG) {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.textAlign = nomangle('left');
            ctx.textBaseline = nomangle('bottom');
            ctx.font = nomangle('14pt Courier');
            ctx.lineWidth = 3;

            const player = firstItem(this.world.bucket('player'));

            let y = CANVAS_HEIGHT - 10;
            for (const line of [
                nomangle('FPS: ') + ~~(1 / elapsed),
                nomangle('FPS (理论): ') + ~~(1000 / (after - before)),
                nomangle('实体: ') + this.world.entities.size,
                nomangle('玩家: ') + (player ? `${~~player.x},${~~player.y}` : ''),
            ].reverse()) {
                ctx.strokeText(line, 10, y);
                ctx.fillText(line, 10, y);
                y -= 20;
            }
        }
    }
}

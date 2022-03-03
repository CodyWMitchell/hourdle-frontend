import './Hourdle.css'
import { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const TotalScore = () => {
    return (
        <div className="TotalScore">{`Total Score: ${localStorage.getItem("total_score")}`}</div>
    )
}

const ShareIcon = ({onClick, ...props}) => {
    return (
        <button className="ShareIcon" onClick={onClick} {...props}>Share!</button>
    )
}

const Key = ({letter, onClick}) => {
    return (
        <button id={letter} className="Key" onClick={onClick}>
            {letter}
        </button>
    )
}

const Keyboard = ({handleKeyPress, handleEnter, handleBackspace}) => {
    return (
        <div className="Keyboard">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter, index) => <Key letter={letter} key={index} onClick={()=>{handleKeyPress(letter)}} />)}
            <button className="button" onClick={()=>{handleBackspace()}}>⟸</button>
            <button className="button" onClick={()=>{handleEnter()}}>ENTER</button>
        </div>
        )
}

const Letter = ({letter, correct}) => {
    return (
        <div className={classNames(
            "Letter",
            {
                "correct": correct=="c",
                "incorrect": correct=="i",
                "misplaced": correct=="m",
                "blank": correct!="c" && correct!="i" && correct!="m"
            }
        )}>
            {letter}
        </div>
    )
}

const Word = ({word, correct}) => {
    return (
        <div className="Word">
            {word.padEnd(5," ").split("").map((letter, index) => <Letter letter={letter} correct={correct[index]} key={index} />)}
        </div>
    )
}

const Hourdle = () => {
    const [guessIndex, setGuessIndex] = useState(0)
    const [guesses, setGuesses] = useState([
        "",
        "",
        "",
        "",
        "",
        ""
    ]);
    const [correct, setCorrect] = useState([
        "",
        "",
        "",
        "",
        "",
        ""
    ]);
    const [time, setTime] = useState("")
    const [hasWon, setHasWon] = useState(false)
    const [hasLost, setHasLost] = useState(false)
    const [gameTime, setGameTime] = useState(new Date())

    const incrementScore = () => {
        let totalScore = localStorage.getItem("total_score");
        localStorage.setItem("total_score", parseInt(totalScore)+1);
    }

    const handleKeyPress = (letter) => {
        if (hasWon || hasLost) {
            return;
        }

        // Add letter to the current guess
        if (guesses[guessIndex].length <= 4) {
            setGuesses(guesses.map((guess, index) => index==guessIndex ? guess+letter : guess))
        }
    }

    const handleBackspace = () => {
        if (hasWon || hasLost) {
            return;
        }

        // remove the last letter from the current guess
        if (guesses[guessIndex].length > 0) {
            setGuesses(guesses.map((guess, index) => index==guessIndex ? guess.slice(0,-1) : guess))
        }
    }

    const updateLetterStatus = (result, letters) => {
        let letterStatus = JSON.parse(localStorage.getItem("letter_status"));

        if (letterStatus == null) { letterStatus = {}}

        [...letters].forEach((letter, i) => {
            letterStatus[letter] = result[i];
        });
        localStorage.setItem("letter_status", JSON.stringify(letterStatus));
        updateLetterColor();
    }

    const updateLetterColor = () => {
        const letterStatus = JSON.parse(localStorage.getItem("letter_status"));

        for (const letter in letterStatus) {
            const element = document.getElementById(letter)
            if (element != null) {
                element.classList.add(`status-${letterStatus[letter]}`);
            }
        }
    }

    const handleEnter = () => {
        if (hasWon || hasLost) {
            return;
        }

        // format time as "mm-dd-yyyy-hh" with leading zeros
        const year = gameTime.getFullYear();
        const month = gameTime.getMonth()+1;
        const day = gameTime.getDate();
        const hour = gameTime.getHours();
        const timeString = `${month<10 ? "0"+month : month}-${day<10 ? "0"+day : day}-${year}-${hour<10 ? "0"+hour : hour}`

        // move to the next guess
        if (guesses[guessIndex] && guesses[guessIndex].length == 5 && guessIndex <= 5) {
            try {
                axios.post("/api/v1/guess", {
                    time: timeString,
                    guess: guesses[guessIndex].toLowerCase().split("")
                }).then(response => {
                    console.log("Response:", response.data);

                    const allowed = response.data.allowed;
    
                    if (allowed) {
                        const result = response.data.result.join("");

                        if (result == "ccccc") {
                            setHasWon(true);
                            incrementScore();
                            toast("You did it!");
                        }

                        if (guessIndex == 5 && result != "ccccc") {
                            setHasLost(true);
                            toast("Try again next time!")
                        }
                        
                        setCorrect(
                            correct.map(
                                (correctWord, index) => index==guessIndex ? result : correctWord
                            )
                        )
                        updateLetterStatus(result, guesses[guessIndex])
                        setGuessIndex(guessIndex+1)
                    } else {
                        toast("Sorry, that's not a valid guess.")
                    }
                })
            } catch (error) {
                console.log("Error:", error);
            }
        }
    }

    useEffect(() => {
        // grab the guesses from localstorage when the component mounts
        const storedGuesses = localStorage.getItem("hourdle");
        if (storedGuesses) {
            // check if guesses are expired
            const storedTime = new Date(JSON.parse(storedGuesses).gameTime);
            const oneHour = 1000 * 60 * 60;
            const now = new Date();
            const diff = now.getTime() - storedTime.getTime();
            if (diff > oneHour) {
                localStorage.clear();
            } else {
                setGuesses(JSON.parse(storedGuesses).guesses);
                setCorrect(JSON.parse(storedGuesses).correct);
                setGuessIndex(JSON.parse(storedGuesses).guessIndex);
                setGameTime(new Date(JSON.parse(storedGuesses).gameTime));
            }
        }

        const totalScore = localStorage.getItem("total_score");
        if (!totalScore) {
            localStorage.setItem("total_score", 0);
        }

        // Create a timer that updates the time every second
        const interval = setInterval(() => {
            setTime((60-new Date().getMinutes())-1 + ":" + (60-new Date().getSeconds()).toString().padStart(2,"0"));
        }, 1000);

        updateLetterColor();
    }, []);

    // save the state to localstorage when any of the state changes
    useEffect(() => {
        saveState();
    }, [guesses, correct, guessIndex, gameTime])

    const saveState = () => {
        const hourdleState = {
            guesses: guesses,
            correct: correct,
            guessIndex: guessIndex,
            gameTime: gameTime,
        }
        localStorage.setItem("hourdle", JSON.stringify(hourdleState));
    }

    const handleShare = () => {
        const url = window.location.href;
        // get correct letters except for empty lines

        const correctLetters = correct.filter(word=>word!="").join("\n").replaceAll('i', '⬜').replaceAll('m', '🟨').replaceAll('c','🟩');

        // format time as "mm-dd-yyyy-hh" with leading zeros
        const year = gameTime.getFullYear();
        const month = gameTime.getMonth()+1;
        const day = gameTime.getDate();
        const hour = gameTime.getHours();
        const timeString = `${month<10 ? "0"+month : month}-${day<10 ? "0"+day : day}-${year}-${hour<10 ? "0"+hour : hour}`

        const shareText = `${timeString}\n${correctLetters}\nHourdle - ${url}`;
 
        navigator.clipboard.writeText(shareText).then(() => {
            toast("Copied to clipboard!")
        });
    }

    return (
        <>
        <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={true}
                newestOnTop={true}
                closeOnClick
            />
        <div className="Hourdle">
            <TotalScore />
            <ShareIcon onClick={handleShare} className="ShareIcon" />
            <div className="Title">HOURDLE</div>
            <div className="Countdown">
                Next word in: <span className="Countdown-number">{time}</span>
            </div>
            {guesses.map((guess, index) => <Word word={guess} correct={correct[index]} key={index} />)}
            <Keyboard handleKeyPress={handleKeyPress} handleBackspace={handleBackspace} handleEnter={handleEnter} />
        </div>
        </>
    )
}

export default Hourdle;
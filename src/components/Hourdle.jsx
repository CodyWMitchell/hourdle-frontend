import './Hourdle.css'
import { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Key = ({letter, onClick}) => {
    return (
        <button className="Key" onClick={onClick}>
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

    const incrementScore = () => {
        let totalScore = window.localStorage.getItem("total_score");
        if (totalScore == null) {
            totalScore = 0
        }
        window.localStorage.setItem("total_score", parseInt(totalScore)+1);
    }

    const handleKeyPress = (letter) => {
        if (hasWon || hasLost) {
            return;
        }

        // Add letter to the current guess
        if (guesses[guessIndex].length <= 4) {
            setGuesses(guesses.map((guess, index) => index==guessIndex ? guess+letter : guess))
        }

        console.log("KEYPRESS", letter);
    }

    const handleBackspace = () => {
        if (hasWon || hasLost) {
            return;
        }

        // remove the last letter from the current guess
        if (guesses[guessIndex].length > 0) {
            setGuesses(guesses.map((guess, index) => index==guessIndex ? guess.slice(0,-1) : guess))
        }

        console.log("BACKSPACE");
    }

    const handleEnter = () => {
        if (hasWon || hasLost) {
            return;
        }

        // format time as "mm-dd-yyyy-hh" with leading zeros
        const year = new Date().getFullYear()
        const month = new Date().getMonth()+1
        const day = new Date().getDate()
        const hour = new Date().getHours()
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
                        setGuessIndex(guessIndex+1)
                    } else {
                        toast("Sorry, that's not a valid guess.")
                    }
                })
            } catch (error) {
                console.log("Error:", error);
            }
        }

        console.log("ENTER");
    }

    // Update the time until the next available word
    useEffect(() => {
        const interval = setInterval(() => {
            setTime((60-new Date().getMinutes())-1 + ":" + (60-new Date().getSeconds()).toString().padStart(2,"0"))
        }, 1000);
    }, []);

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
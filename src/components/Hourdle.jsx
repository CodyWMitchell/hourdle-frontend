import './Hourdle.css'
import { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames';

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
    const [won, setWon] = useState(false)
    const [lost, setLost] = useState(false)

    const handleKeyPress = (letter) => {
        // Add letter to the current guess
        if (guesses[guessIndex].length <= 4) {
            setGuesses(guesses.map((guess, index) => index==guessIndex ? guess+letter : guess))
        }

        console.log("KEYPRESS", letter);
    }

    const handleBackspace = () => {
        // remove the last letter from the current guess
        if (guesses[guessIndex].length > 0) {
            setGuesses(guesses.map((guess, index) => index==guessIndex ? guess.slice(0,-1) : guess))
        }

        console.log("BACKSPACE");
    }

    const updateLetterStatus = (result, letters) => {
        let letterStatus = JSON.parse(window.localStorage.getItem("letter_status"));

        if (letterStatus == null) { letterStatus = {}}

        [...letters].forEach((letter, i) => {
            letterStatus[letter] = result[i];
        });
        window.localStorage.setItem("letter_status", JSON.stringify(letterStatus));
        updateLetterColor();
    }

    const updateLetterColor = () => {
        const letterStatus = JSON.parse(window.localStorage.getItem("letter_status"));

        for (const letter in letterStatus) {
            const element = document.getElementById(letter)
            if (element != null) {
                element.classList.add(`status-${letterStatus[letter]}`);
            }
        }
    }

    const handleEnter = () => {

        // format time as "mm-dd-yyyy-hh" with leading zeros
        const year = new Date().getFullYear()
        const month = new Date().getMonth()+1
        const day = new Date().getDate()
        const hour = new Date().getHours()
        const timeString = `${month<10 ? "0"+month : month}-${day<10 ? "0"+day : day}-${year}-${hour<10 ? "0"+hour : hour}`

        // move to the next guess
        if (guesses[guessIndex].length == 5 && guessIndex <= 5) {
            try {
                axios.post("/api/v1/guess", {
                    time: timeString,
                    guess: guesses[guessIndex].toLowerCase().split("")
                }).then(response => {
                    console.log("Response:", response.data);

                    const allowed = response.data.allowed;
    
                    if (allowed) {
                        const result = response.data.result.join("");
                        
                        setCorrect(
                            correct.map(
                                (correctWord, index) => index==guessIndex ? result : correctWord
                            )
                        )
                        updateLetterStatus(result, guesses[guessIndex])
                        setGuessIndex(guessIndex+1)
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
        updateLetterColor();
    }, []);

    return (
        <div className="Hourdle">
            <div className="Title">HOURDLE</div>
            <div className="Countdown">
                Next word in: <span className="Countdown-number">{time}</span>
            </div>
            {guesses.map((guess, index) => <Word word={guess} correct={correct[index]} key={index} />)}
            <Keyboard handleKeyPress={handleKeyPress} handleBackspace={handleBackspace} handleEnter={handleEnter} />
        </div>
    )
}

export default Hourdle;
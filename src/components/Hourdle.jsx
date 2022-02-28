import './Hourdle.css'
import { useState } from 'react';
import classNames from 'classnames';

const Key = ({letter}) => {
    return (
        <button className="Key">
            {letter}
        </button>
    )
}

const Keyboard = () => {
    return (
        <div className="Keyboard">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter, index) => <Key letter={letter} key={index} />)}
            <button className="button">⟸</button>
            <button className="button">ENTER</button>
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
            {word.split("").map((letter, index) => <Letter letter={letter} correct={correct[index]} key={index} />)}
        </div>
    )
}

const Hourdle = () => {
    const [guesses, setGuesses] = useState([
        "ABCDE",
        "ABCDE",
        "AAA  ",
        "     ",
        "     ",
        "     "
    ]);

    const [correct, setCorrect] = useState([
        "cmiii",
        "cmiii",
        "",
        "",
        "",
        ""
    ]);

    return (
        <div className="Hourdle">
            <div className="Title">HOURDLE</div>
            {guesses.map((guess, index) => <Word word={guess} correct={correct[index]} key={index} />)}
            <Keyboard />
        </div>
    )
}

export default Hourdle;
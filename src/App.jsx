import { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import Hourdle from './components/Hourdle'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <Hourdle />
    </div>
  )
}

export default App

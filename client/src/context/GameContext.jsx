import { createContext, useContext, useReducer, useEffect } from 'react'

const GameContext = createContext(null)

const initialState = {
  playerName: '',
  room: null,
  gameState: null,
  myHand: [],
  chat: [],
  error: null,
  roundResult: null,
  winner: null,
  finalStandings: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_NAME':
      localStorage.setItem('yaniv_name', action.payload)
      return { ...state, playerName: action.payload }
    case 'SET_ROOM':
      return { ...state, room: action.payload }
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload, myHand: action.payload?.myHand ?? [] }
    case 'ADD_CHAT':
      return { ...state, chat: [...state.chat, action.payload] }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_ROUND_RESULT':
      return { ...state, roundResult: action.payload }
    case 'SET_WINNER':
      return { ...state, winner: action.payload }
    case 'SET_FINAL_STANDINGS':
      return { ...state, finalStandings: action.payload }
    case 'RESET':
      return { ...initialState, playerName: state.playerName }
    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const savedName = localStorage.getItem('yaniv_name')
    if (savedName) dispatch({ type: 'SET_NAME', payload: savedName })
  }, [])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}

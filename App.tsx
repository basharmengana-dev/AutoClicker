import React, { useState } from 'react'
import { Text, Alert, View, Button } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import axios, { AxiosResponse } from 'axios'
import { apiKey } from './secrets'


interface ChatGPTResponse {
  choices: { message: { content: string } }[]
}

const sendRequestToChatGPT = async (prompt: string, componentSnapshot: object): Promise<string | null> => {

  const apiUrl = 'https://api.openai.com/v1/chat/completions'

  try {
    const response: AxiosResponse<ChatGPTResponse> = await axios.post(apiUrl, {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a useful assistant that accepts a JSON snapshot generated with the toJson() function @testing-library/react-native and try to understand the snapshot and answer questions' },
        { role: 'user', content: `${prompt}\n\nComponent Snapshot: ${JSON.stringify(componentSnapshot, null, 2)}` },
      ],
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const chatGPTResponse = response.data.choices[0].message.content.trim()
    console.log('ChatGPT Response:', chatGPTResponse)
    return chatGPTResponse
  } catch (error) {
    console.error('Failed to send request to ChatGPT:', error)
    return null
  }
}

const App: React.FC = () => {
  const [response, setResponse] = useState<string | null>(null)

  const simulateButtonPress = (testID: string) => {
    const { getByTestId } = render(<AppContent />)
    const button = getByTestId(testID)
    fireEvent.press(button)
  }

  const handleRequest = async () => {
    const { toJSON } = render(<AppContent />)
    const componentSnapshot = toJSON()
    console.log('Component Snapshot:', JSON.stringify(componentSnapshot, null, 2))

    const examplePrompt = 'What is the testID of the component that turns on the lights? It is usually written like this: "testID": "test_id_value". Please respond with exactly the testID, and nothing else. When you respond, omit the quotes.'
    const chatGPTResponse = await sendRequestToChatGPT(examplePrompt, componentSnapshot)

    if (chatGPTResponse) {
      setResponse(chatGPTResponse)
      simulateButtonPress(chatGPTResponse)
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <AppContent />
      <View
        style={{
          paddingBottom: 50,
          width: '100%',
          alignItems: 'center',
        }}>
        <Button title="Ask ChatGPT to press on light switch!" onPress={handleRequest} />
        {response && (
          <Text style={{ marginTop: 20, fontSize: 16 }}>ChatGPT Response: {response}</Text>
        )}
      </View>
    </View>
  )
}

const AppContent: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>When there is dark all you need to do is ...</Text>
    <Button
      testID="light_switch"
      onPress={() =>
        Alert.alert('Light switch', 'The lights are on!')
      }
      title="Light switch"
    />
  </View>
)

export default App

import { Button } from '@/components/Button'
import { Calendar } from '@/components/Calendar'
import { GuestEmail } from '@/components/Email'
import { Input } from '@/components/Input'
import { Loading } from '@/components/Loading'
import { Modal } from '@/components/Modal'
import { tripServer } from '@/server/trip-server'
import { tripStorage } from '@/storage/trip'
import { colors } from '@/styles/colors'
import { calendarUtils, DatesSelected } from '@/utils/calendarUtils'
import { validateInput } from '@/utils/validateInput'
import dayjs from 'dayjs'
import { router } from 'expo-router'
import { ArrowRight, AtSign, Calendar as IConCalenndar, MapPin, Settings2, UserRoundPlus } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Image, Keyboard, Text, View } from 'react-native'
import { DateData } from 'react-native-calendars'

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAIL = 2,
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2,
}

export default function Index() {
   // LOADING
   const [isCreatingTrip, setIsCreatingTrip] = useState(false)
   const [isGettingTrip, setIsGettingTrip] = useState(true)
 
   // DATA
   const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS)
   const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
   const [destination, setDestination] = useState("")
   const [emailToInvite, setEmailToInvite] = useState("")
   const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])
 
  // MODAL
  const [showModal, setShowModal] = useState(MODAL.NONE)

  function handleNextStepForm() {
    if (
      destination.trim().length === 0 ||
      !selectedDates.startsAt ||
      !selectedDates.endsAt
    ) {
      return Alert.alert(
        "Detalhes da viagem",
        "Preencha todos as informações da viagem para seguir."
      )
    }

    if (destination.length < 4) {
      return Alert.alert(
        "Detalhes da viagem",
        "O destino deve ter pelo menos 4 caracteres."
      )
    }

    if (stepForm === StepForm.TRIP_DETAILS) {
      return setStepForm(StepForm.ADD_EMAIL)
    }

    Alert.alert("Nova viagem", "Confirmar viagem?", [
      {
        text: "Não",
        style: "cancel",
      },
      {
        text: "Sim",
        onPress: createTrip,
      },
    ])
  }


  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    })

    setSelectedDates(dates)
  }

  function handleRemoveEmail(emailToRemove: string) {
    setEmailsToInvite((prevState) =>
      prevState.filter((email) => email !== emailToRemove)
    )
  }

  function handleAddEmail() {
    if (!validateInput.email(emailToInvite)) {
      return Alert.alert("Convidado", "E-mail inválido!")
    }

    const emailAlreadyExists = emailsToInvite.find(
      (email) => email === emailToInvite
    )

    if (emailAlreadyExists) {
      return Alert.alert("Convidado", "E-mail já foi adicionado!")
    }

    setEmailsToInvite((prevState) => [...prevState, emailToInvite])
    setEmailToInvite("")
  }

  async function saveTrip(tripId: string) {
    try {
      await tripStorage.save(tripId)
      router.navigate("/trip/" + tripId)
    } catch (error) {
      Alert.alert(
        "Salvar viagem",
        "Não foi possível salvar o id da viagem no dispositivo."
      )
      console.log(error)
    }
  }

  async function createTrip() {
    try {
      setIsCreatingTrip(true)

      const newTrip = await tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toISOString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toISOString(),
        emails_to_invite: emailsToInvite,
      })

      Alert.alert("Nova viagem", "Viagem criada com sucesso!", [
        {
          text: "OK. Continuar.",
          onPress: () => saveTrip(newTrip.tripId),
        },
      ])
    } catch (error) {
      console.log(error)
      
    } finally {
      setIsCreatingTrip(false)
    }
  }

  async function getTrip() {
    try {
      const tripId = await tripStorage.get()
      if (!tripId) {
        return setIsGettingTrip(false)
      }

      const trip = await tripServer.getById(tripId)
      if (trip) {
        return router.navigate(`trip/${tripId}`)
      }

    } catch (error) {
      setIsGettingTrip(false)
      console.log(error)
    }

  
  }

  useEffect(() => {
    getTrip()
  }, [])

  if (isGettingTrip) {
    return <Loading />
  }

  return (
    <View className='flex-1 items-center justify-center px-5'>
      <Image 
        source={require("@/assets/logo.png")} 
        className='h-8' 
        resizeMode='contain'
      />
      <Image source={require("@/assets/bg.png")} className='absolute'/>
      <Text className='text-zinc-400 font-regular text-center text-lg mt-3'>
        Convide seus amigos e planeje sua {"\n"} próxima viagem
      </Text>

      <View className="w-full bg-zinc-900 p-4 rounded-xl my-8 border border-zinc-800">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field 
            placeholder='Para onde?' 
            editable={stepForm === StepForm.TRIP_DETAILS} 
            onChangeText={setDestination}
            value={destination}
          />
        </Input>

        <Input>
          <IConCalenndar color={colors.zinc[400]} size={20} />
          <Input.Field 
            placeholder='Quando?' 
            editable={stepForm === StepForm.TRIP_DETAILS}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPress={() => stepForm === StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)}
            value={selectedDates.formatDatesInText}
          />
        </Input>

        { stepForm === StepForm.ADD_EMAIL && (
            <View>
              <View className='border-b py-3 border-zinc-800'>
                <Button variant='secondary' onPress={() => setStepForm(StepForm.TRIP_DETAILS)}>
                  <Button.Title>Alterar Local/Data</Button.Title>
                  <Settings2 color={colors.zinc[200]} size={20}/>
                </Button>
              </View>

              <Input>
                <UserRoundPlus color={colors.zinc[400]} size={20} />
                <Input.Field 
                  placeholder='Qeum estará na viagem?'
                  onFocus={() => Keyboard.dismiss()}
                  showSoftInputOnFocus={false}
                  onPress={() => setShowModal(MODAL.GUESTS)}
                  value={
                    emailsToInvite.length > 0 
                    ? `${emailsToInvite.length} pessoas(a) convidada(s)`
                    : ""
                  }
                  autoCorrect={false}
                />
              </Input>
            </View>
        )}
        

        <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
            <Button.Title>{
              stepForm === StepForm.TRIP_DETAILS 
              ? "Confirmar"
              : "Confirmar Viagem"
            }</Button.Title>
            <ArrowRight color={colors.lime[950]} size={20}/>
          </Button>
      </View>

      <Text className='text-zinc-500 font-regular text-center text-base'>
        Ao planjear sua viagem pela plann.er você automaticamente concorda com nossos{" "}
        <Text className='text-zinc-300 underline'>termos de uso e políticas de privacidade</Text>
      </Text>   

      <Modal 
        title='Selecionar datas' 
        subtitle='Selecione a data de ida e volta da viagem'
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className='gap-4 mt-4'>
          <Calendar 
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
            minDate={dayjs().toISOString()}
          />
          <Button onPress={() => setShowModal(MODAL.NONE)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>
      <Modal 
        title='Selecionar convidados' 
        subtitle='Os convidados irão receber e-mails para confirmar a participação na viagem'
        visible={showModal === MODAL.GUESTS}
        onClose={() => setShowModal(MODAL.NONE)}
        
      >
        <View className='my-2 flex-wrap gap-2 border-b border-zinc-800 py-5'>
          {
            emailsToInvite.length > 0 ? (
              emailsToInvite.map(email => (
                <GuestEmail 
                  email={email}
                  key={email}
                  onRemove={() => {handleRemoveEmail(email)}}
                />
              ))
            ) : (
              <Text className='text-zinc-600 text-base font-regular' >Nenhum e-mail adicionado.</Text>
            )
          }
        </View>
        <View className='gap-4 mt-4'>
          <Input variant='secondary'>
            <AtSign color={colors.zinc[400]} size={20}/>
            <Input.Field 
               placeholder="Digite o e-mail do convidado"
               keyboardType="email-address"
               onChangeText={(text) => setEmailToInvite(text)}
               value={emailToInvite}
               returnKeyType="send"
               onSubmitEditing={handleAddEmail}
            />
          </Input>
          <Button onPress={handleAddEmail} >
              <Button.Title>Convidar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}
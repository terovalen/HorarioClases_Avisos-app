/** Grilla de un día: huecos con long-press (crear), tarjetas con manija
 *  de arrastre (cambiar hora de fin) y fling horizontal (cambiar día).
 *  Cada gesto tiene botón equivalente accesible en la pantalla. */
/* eslint-disable react-hooks/immutability --
   Los SharedValue de react-native-reanimated se mutan por diseño (.value);
   esa es su API oficial para animar desde el hilo de UI. */
import { useMemo, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { minutosDelDia, parseHora } from '../logica/tiempo';
import type { BloqueConMateria } from '../logica/tipos';

export const HORA_INICIO = 6;
export const CANTIDAD_HORAS = 16; // 06:00 – 22:00
export const FILA_ALTO = 64;
export const PX_POR_MINUTO = FILA_ALTO / 60;
const PASO_MINUTOS = 15;

type Props = {
  bloques: BloqueConMateria[];
  alPulsarLargo: (hora: number, minuto: number) => void;
  alAjustarFin: (id: string, hora_fin: string) => void;
  alAbrirMenu: (id: string) => void;
  alCambiarDia: (delta: number) => void;
  alIrHoy: () => void;
};

type Marco = { vista: SharedValue<number>; visible: SharedValue<boolean> };

export function GrillaDia({
  bloques,
  alPulsarLargo,
  alAjustarFin,
  alAbrirMenu,
  alCambiarDia,
  alIrHoy,
}: Props): ReactElement {
  const marco: Marco = { vista: useSharedValue(0), visible: useSharedValue(false) };
  const fondo = useMemo(
    () => gestoDeFondo(alCambiarDia, alIrHoy),
    [alCambiarDia, alIrHoy],
  );

  return (
    <GestureDetector gesture={fondo}>
      <View style={[styles.grilla, { height: CANTIDAD_HORAS * FILA_ALTO }]}>
        <View>
          {Array.from({ length: CANTIDAD_HORAS }, (_, i) => (
            <FilaHora key={i} hora={HORA_INICIO + i} alPulsarLargo={alPulsarLargo} />
          ))}
        </View>
        <View style={styles.capa} pointerEvents="box-none">
          {bloques.map((clase) => (
            <TarjetaBloque
              key={clase.bloque.id}
              clase={clase}
              alAjustarFin={alAjustarFin}
              alAbrirMenu={alAbrirMenu}
              marco={marco}
            />
          ))}
          <LineaMarco marco={marco} />
        </View>
      </View>
    </GestureDetector>
  );
}

function gestoDeFondo(alCambiarDia: (delta: number) => void, alIrHoy: () => void) {
  const dobleToque = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onStart(() => alIrHoy());
  const izquierda = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onStart(() => alCambiarDia(1));
  const derecha = Gesture.Fling()
    .direction(Directions.RIGHT)
    .runOnJS(true)
    .onStart(() => alCambiarDia(-1));
  return Gesture.Exclusive(dobleToque, izquierda, derecha);
}

function FilaHora({
  hora,
  alPulsarLargo,
}: {
  hora: number;
  alPulsarLargo: (hora: number, minuto: number) => void;
}): ReactElement {
  const gesto = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(350)
        .runOnJS(true)
        .onStart((e) => {
          const paso = Math.floor(((e.y / FILA_ALTO) * 60) / PASO_MINUTOS) * PASO_MINUTOS;
          const minuto = Math.min(45, Math.max(0, paso));
          alPulsarLargo(hora, minuto);
        }),
    [alPulsarLargo, hora],
  );
  return (
    <GestureDetector gesture={gesto}>
      <View style={styles.fila}>
        <Text style={styles.horaTexto}>{String(hora).padStart(2, '0')}:00</Text>
      </View>
    </GestureDetector>
  );
}

function TarjetaBloque({
  clase,
  alAjustarFin,
  alAbrirMenu,
  marco,
}: {
  clase: BloqueConMateria;
  alAjustarFin: (id: string, hora_fin: string) => void;
  alAbrirMenu: (id: string) => void;
  marco: Marco;
}): ReactElement {
  const inicio = minutosDelDia(parseHora(clase.bloque.hora_inicio) ?? { h: 0, m: 0 });
  const fin = minutosDelDia(parseHora(clase.bloque.hora_fin) ?? { h: 0, m: 0 });
  return (
    <View
      style={[
        styles.tarjeta,
        {
          top: (inicio - HORA_INICIO * 60) * PX_POR_MINUTO + 1,
          height: (fin - inicio) * PX_POR_MINUTO - 2,
          backgroundColor: clase.materia.color,
        },
      ]}
    >
      <Pressable
        onPress={() => alAbrirMenu(clase.bloque.id)}
        accessibilityRole="button"
        accessibilityLabel={`Menú de ${clase.materia.nombre}, ${clase.bloque.hora_inicio} a ${clase.bloque.hora_fin}`}
      >
        <Text style={styles.titulo} numberOfLines={2}>
          {clase.materia.nombre}
        </Text>
        <Text style={styles.subtitulo}>
          {clase.materia.docente ? `· ${clase.materia.docente}` : ''}
          {clase.materia.salon ? ` · Salón ${clase.materia.salon}` : ''}
        </Text>
        <Text style={styles.horas}>
          {clase.bloque.hora_inicio}–{clase.bloque.hora_fin}
        </Text>
      </Pressable>
      <ManijaFin clase={clase} alAjustarFin={alAjustarFin} marco={marco} />
    </View>
  );
}

/** Arrastre vertical sobre el borde inferior: cambia la hora de fin. */
function ManijaFin({
  clase,
  alAjustarFin,
  marco,
}: {
  clase: BloqueConMateria;
  alAjustarFin: (id: string, hora_fin: string) => void;
  marco: Marco;
}): ReactElement {
  const inicio = minutosDelDia(parseHora(clase.bloque.hora_inicio) ?? { h: 0, m: 0 });
  const fin = minutosDelDia(parseHora(clase.bloque.hora_fin) ?? { h: 0, m: 0 });
  const base = useSharedValue(fin);
  const gesto = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(180)
        .onBegin(() => {
          base.value = fin;
          marco.vista.value = fin;
          marco.visible.value = true;
        })
        .onUpdate((e) => {
          const delta =
            Math.round(e.translationY / PX_POR_MINUTO / PASO_MINUTOS) * PASO_MINUTOS;
          marco.vista.value = Math.max(
            inicio + PASO_MINUTOS,
            Math.min(22 * 60, base.value + delta),
          );
        })
        .onEnd(() => {
          const objetivo = marco.vista.value;
          const h = Math.floor(objetivo / 60);
          const m = objetivo % 60;
          const dos = (n: number) => (n < 10 ? '0' : '') + n;
          marco.visible.value = false;
          runOnJS(alAjustarFin)(clase.bloque.id, `${dos(h)}:${dos(m)}`);
        }),
    [clase.bloque.id, inicio, fin, alAjustarFin, base, marco],
  );
  return (
    <GestureDetector gesture={gesto}>
      <View
        style={styles.manija}
        accessibilityLabel="Arrastra para cambiar la hora de fin"
      >
        <View style={styles.barraManija} />
      </View>
    </GestureDetector>
  );
}

/** Línea guía que sigue el arrastre (reanimated). */
function LineaMarco({ marco }: { marco: Marco }): ReactElement {
  const estilo = useAnimatedStyle(() => ({
    top: (marco.vista.value - HORA_INICIO * 60) * PX_POR_MINUTO - 1,
    opacity: marco.visible.value ? 1 : 0,
  }));
  return <Animated.View style={[styles.marco, estilo]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  grilla: { position: 'relative' },
  fila: {
    height: FILA_ALTO,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d6dbe2',
    justifyContent: 'flex-start',
  },
  horaTexto: { color: '#9ba6b4', fontSize: 11, padding: 4 },
  capa: { position: 'absolute', left: 48, right: 6, top: 0, bottom: 0 },
  tarjeta: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 8,
    padding: 6,
    overflow: 'hidden',
  },
  titulo: { color: '#fff', fontWeight: '800', fontSize: 13 },
  subtitulo: { color: '#eff6ff', fontSize: 11 },
  horas: { color: '#eff6ff', fontSize: 10, marginTop: 2 },
  manija: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 16 },
  barraManija: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: 24,
  },
  marco: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#16a34a',
  },
});

import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const API_BASE = 'http://localhost:8080';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString();
};

const formatTimeRange = (start, end) => {
  if (!start || !end) return '-';
  const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${startTime} - ${endTime}`;
};

const toDateTimeLocalValue = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoOffset = (localValue) => {
  if (!localValue) return '';
  return new Date(localValue).toISOString();
};

const getErrorMessage = async (res) => {
  if (res.status === 401 || res.status === 403) return 'Brak autoryzacji. Zaloguj sie ponownie.';
  if (res.status === 409) return 'Konflikt danych. Sprawdz rezerwacje i sprobuj ponownie.';
  if (res.status === 422) return 'Nieprawidlowe dane. Popraw pola i sprobuj ponownie.';
  if (res.status === 400) return 'Blad walidacji. Sprawdz dane formularza.';

  try {
    const text = await res.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        return data.message || data.error || text;
      } catch {
        return text;
      }
    }
  } catch {
    return 'Wystapil blad serwera.';
  }

  return 'Wystapil blad serwera.';
};

const spotTypeOptions = [
  { value: 'ALL', label: 'Wszystkie' },
  { value: 'STANDARD', label: 'Standardowe' },
  { value: 'DISABLED', label: 'Niepelnosprawni' },
  { value: 'ELECTRIC', label: 'Elektryczne' },
  { value: 'VIP', label: 'VIP' }
];

const viewFilters = ['ALL', 'CURRENT', 'PAST', 'CANCELLED'];

const Reservations = () => {
  const { token } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [view, setView] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [selectedRes, setSelectedRes] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const [isFormOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState({ spotId: '', startTime: '', endTime: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const [slots, setSlots] = useState([]);
  const [slotsError, setSlotsError] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [spotType, setSpotType] = useState('ALL');

  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('ONLINE');
  const [paymentError, setPaymentError] = useState('');
  const [isPaying, setPaying] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchReservations = async (nextView = view) => {
    if (!token) return;
    setLoading(true);
    setListError('');
    try {
      const res = await fetch(`${API_BASE}/api/reservations?view=${nextView}`, {
        headers: { ...authHeaders }
      });
      if (!res.ok) {
        setListError(await getErrorMessage(res));
        setReservations([]);
        return;
      }
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      setListError('Nie udalo sie pobrac rezerwacji.');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (nextType = spotType) => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const typeQuery = nextType && nextType !== 'ALL' ? `?type=${nextType}` : '';
      const res = await fetch(`${API_BASE}/api/slots${typeQuery}`);
      if (!res.ok) {
        setSlotsError(await getErrorMessage(res));
        setSlots([]);
        return;
      }
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setSlotsError('Nie udalo sie pobrac miejsc.');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchPayments = async (reservationId) => {
    if (!token || !reservationId) return;
    setPaymentInfo(null);
    try {
      const res = await fetch(`${API_BASE}/api/payments?status=PAID`, {
        headers: { ...authHeaders }
      });
      if (!res.ok) return;
      const data = await res.json();
      const match = Array.isArray(data) ? data.find((item) => item.reservationId === reservationId) : null;
      setPaymentInfo(match || null);
    } catch (err) {
      setPaymentInfo(null);
    }
  };

  const fetchDetails = async (reservationId) => {
    if (!token || !reservationId) return;
    setDetailsError('');
    setDetails(null);
    setQrCode(null);
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${reservationId}`, {
        headers: { ...authHeaders }
      });
      if (!res.ok) {
        setDetailsError(await getErrorMessage(res));
        return;
      }
      const data = await res.json();
      setDetails(data);
      fetchPayments(data.id);
      if (data.qrUuid || ['CONFIRMED', 'COMPLETED', 'PAID'].includes(data.status)) {
        const qrRes = await fetch(`${API_BASE}/api/reservations/${reservationId}/qr`, {
          headers: { ...authHeaders }
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQrCode(qrData.pngBase64 || null);
        }
      }
    } catch (err) {
      setDetailsError('Nie udalo sie pobrac szczegolow.');
    }
  };

  useEffect(() => {
    if (token) fetchReservations(view);
  }, [token, view]);

  useEffect(() => {
    if (isFormOpen) fetchSlots(spotType);
  }, [isFormOpen, spotType]);

  const openDetails = (reservation) => {
    setSelectedRes(reservation);
    setDetails(null);
    setQrCode(null);
    setDetailsError('');
    fetchDetails(reservation.id);
  };

  const closeDetails = () => {
    setSelectedRes(null);
    setDetails(null);
    setQrCode(null);
    setDetailsError('');
    setPaymentInfo(null);
  };

  const openCreateForm = () => {
    setFormMode('create');
    setFormData({ spotId: '', startTime: '', endTime: '' });
    setFormError('');
    setSpotType('ALL');
    setFormOpen(true);
  };

  const openEditForm = (reservation) => {
    setFormMode('edit');
    setFormData({
      spotId: reservation.spotId ? String(reservation.spotId) : '',
      startTime: toDateTimeLocalValue(reservation.startTime),
      endTime: toDateTimeLocalValue(reservation.endTime)
    });
    setFormError('');
    setSpotType('ALL');
    setFormOpen(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!token) return;
    setFormError('');
    setSubmitting(true);

    const payload = {
      spotId: Number(formData.spotId),
      startTime: toIsoOffset(formData.startTime),
      endTime: toIsoOffset(formData.endTime)
    };

    try {
      const isEdit = formMode === 'edit' && (details || selectedRes);
      const reservationId = isEdit ? (details?.id || selectedRes?.id) : null;
      const url = isEdit ? `${API_BASE}/api/reservations/${reservationId}` : `${API_BASE}/api/reservations`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setFormError(await getErrorMessage(res));
        return;
      }

      setFormOpen(false);
      await fetchReservations(view);
      if (reservationId) fetchDetails(reservationId);
    } catch (err) {
      setFormError('Nie udalo sie zapisac rezerwacji.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelReservation = async (reservationId) => {
    if (!token || !reservationId) return;
    const confirmed = window.confirm('Na pewno anulowac rezerwacje?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: { ...authHeaders }
      });
      if (!res.ok) {
        setDetailsError(await getErrorMessage(res));
        return;
      }
      await fetchReservations(view);
      closeDetails();
    } catch (err) {
      setDetailsError('Nie udalo sie anulowac rezerwacji.');
    }
  };

  const openPayment = () => {
    setPaymentType('ONLINE');
    setPaymentError('');
    setPaymentOpen(true);
  };

  const submitPayment = async () => {
    if (!token || !selectedRes) return;
    setPaying(true);
    setPaymentError('');
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ reservationId: selectedRes.id, paymentType })
      });
      if (!res.ok) {
        setPaymentError(await getErrorMessage(res));
        return;
      }
      setPaymentOpen(false);
      await fetchReservations(view);
      fetchDetails(selectedRes.id);
    } catch (err) {
      setPaymentError('Nie udalo sie wykonac platnosci.');
    } finally {
      setPaying(false);
    }
  };

  if (!token) return <h2 className="text-center mt-10">Zaloguj sie, aby zobaczyc rezerwacje.</h2>;

  const activeReservation = details || selectedRes;
  const isEditable = activeReservation && !['CANCELLED', 'COMPLETED'].includes(activeReservation.status);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-200">REZERWACJE UZYTKOWNIKA:</h2>
        <button
          onClick={openCreateForm}
          className="bg-parking-blue hover:bg-blue-700 px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest shadow-lg"
        >
          Nowa rezerwacja
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {viewFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setView(filter)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              view === filter ? 'bg-parking-blue text-white' : 'bg-parking-panel text-gray-300 hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {listError && <p className="text-red-400 text-sm">{listError}</p>}
      {loading && <p className="text-gray-400">Ladowanie rezerwacji...</p>}

      <div className="flex flex-wrap gap-6">
        {!loading && reservations.length === 0 && (
          <p className="text-gray-300">Brak rezerwacji dla wybranego widoku.</p>
        )}
        {reservations.map((res) => (
          <div
            key={res.id}
            onClick={() => openDetails(res)}
            className="bg-gray-600 w-52 p-4 rounded-xl cursor-pointer hover:bg-gray-500 shadow-lg text-center flex flex-col gap-2"
          >
            <p className="font-semibold text-gray-300">Rezerwacja nr {res.id}</p>
            <p className="text-white">Miejsce {res.spotCode || res.spotId}</p>
            <p className="text-gray-400 text-xs">{formatDate(res.startTime)}</p>
            <p className="text-xs text-gray-300">{res.status}</p>
          </div>
        ))}
      </div>

      {selectedRes && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-[#0066cc] text-white p-6 rounded-2xl w-[360px] relative flex flex-col items-center text-center shadow-2xl border border-blue-400">
            <button onClick={closeDetails} className="absolute top-2 right-4 text-xl font-bold">X</button>
            <h2 className="text-lg font-bold mb-4 uppercase">REZERWACJA NR {selectedRes.id}</h2>

            {detailsError && <p className="text-yellow-200 text-xs mb-2">{detailsError}</p>}

            <p>Miejsce {activeReservation?.spotCode || activeReservation?.spotId}</p>
            <p className="text-sm opacity-80 mt-1">Data: {formatDate(activeReservation?.startTime)}</p>
            <p className="text-sm opacity-80">Godzina: {formatTimeRange(activeReservation?.startTime, activeReservation?.endTime)}</p>
            <p className="text-sm opacity-80">Status: {activeReservation?.status || '-'}</p>
            <p className="text-sm opacity-80">
              Koszt: {paymentInfo?.amount ? `${paymentInfo.amount} PLN` : '-'}
            </p>

            <div className="bg-white p-2 mt-4 rounded shadow-inner">
              {qrCode ? (
                <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-black text-xs">Brak QR</div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {isEditable && (
                <button
                  onClick={() => openEditForm(activeReservation)}
                  className="bg-white text-parking-blue font-bold py-2 px-6 rounded-full shadow-md"
                >
                  Edytuj
                </button>
              )}
              {activeReservation?.status !== 'CANCELLED' && (
                <button
                  onClick={() => cancelReservation(activeReservation?.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full shadow-md"
                >
                  Anuluj
                </button>
              )}
              {activeReservation?.status === 'PENDING_PAYMENT' && (
                <button
                  onClick={openPayment}
                  className="bg-parking-black text-white font-bold py-2 px-6 rounded-full shadow-md"
                >
                  Oplac
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-parking-panel text-white p-6 rounded-2xl w-[440px] shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold uppercase">
                {formMode === 'edit' ? 'Edytuj rezerwacje' : 'Nowa rezerwacja'}
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-xl font-bold">X</button>
            </div>

            {formError && <p className="text-red-400 text-sm mb-2">{formError}</p>}

            <form onSubmit={submitForm} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-gray-300">Typ miejsca</label>
                <select
                  className="rounded bg-white text-black px-2 py-2"
                  value={spotType}
                  onChange={(e) => setSpotType(e.target.value)}
                >
                  {spotTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-gray-300">Miejsce</label>
                <select
                  className="rounded bg-white text-black px-2 py-2"
                  value={formData.spotId}
                  onChange={(e) => setFormData({ ...formData, spotId: e.target.value })}
                  required
                >
                  <option value="">Wybierz miejsce</option>
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.spotCode} ({slot.spotType}) - {slot.status}
                    </option>
                  ))}
                </select>
                {slotsLoading && <p className="text-xs text-gray-400">Ladowanie miejsc...</p>}
                {slotsError && <p className="text-xs text-red-400">{slotsError}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-gray-300">Start</label>
                <input
                  type="datetime-local"
                  className="rounded bg-white text-black px-2 py-2"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-gray-300">Koniec</label>
                <input
                  type="datetime-local"
                  className="rounded bg-white text-black px-2 py-2"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 border rounded"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-parking-blue text-white px-6 py-2 rounded-full font-bold uppercase disabled:opacity-70"
                >
                  {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentOpen && selectedRes && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-parking-panel text-white p-6 rounded-2xl w-[360px] shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold uppercase">Oplata rezerwacji</h3>
              <button onClick={() => setPaymentOpen(false)} className="text-xl font-bold">X</button>
            </div>

            {paymentError && <p className="text-red-400 text-sm mb-2">{paymentError}</p>}

            <div className="flex flex-col gap-3">
              <label className="text-xs uppercase tracking-widest text-gray-300">Typ platnosci</label>
              <select
                className="rounded bg-white text-black px-2 py-2"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <option value="ONLINE">Online</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={submitPayment}
                disabled={isPaying}
                className="bg-parking-blue text-white px-6 py-2 rounded-full font-bold uppercase disabled:opacity-70"
              >
                {isPaying ? 'Przetwarzanie...' : 'Oplac'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
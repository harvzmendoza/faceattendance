<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionType;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use App\Models\Participant;
use App\Services\EventService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class EventController extends Controller
{
    public function __construct(private EventService $events) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Event::class);

        $search = $request->string('search')->toString();

        return Inertia::render('events/index', [
            'events' => Event::query()
                ->withCount(['participants', 'attendanceRecords'])
                ->when($search !== '', function ($query) use ($search): void {
                    $query->where(function ($builder) use ($search): void {
                        $builder->where('name', 'like', '%'.$search.'%')
                            ->orWhere('event_code', 'like', '%'.$search.'%')
                            ->orWhere('venue', 'like', '%'.$search.'%');
                    });
                })
                ->latest()
                ->paginate(15)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
            'can' => [
                'create' => $request->user()?->can('create', Event::class) ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Event::class);

        return Inertia::render('events/create', [
            'statuses' => $this->statusOptions(),
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        $event = $this->events->create($request->validated());

        return to_route('events.show', $event)->with('success', 'Event created.');
    }

    public function show(Request $request, Event $event): Response
    {
        $this->authorize('view', $event);

        $search = $request->string('search')->toString();

        $event->load(['sessions' => function ($query): void {
            $query->withCount('attendanceRecords')->orderBy('id');
        }]);
        $event->loadCount(['participants', 'attendanceRecords']);

        return Inertia::render('events/show', [
            'event' => $event->only([
                'id', 'name', 'event_code', 'description', 'venue', 'starts_at', 'ends_at', 'status',
            ]),
            'sessions' => $event->sessions
                ->map(fn ($session): array => [
                    'id' => $session->id,
                    'name' => $session->name,
                    'type' => $session->type->value,
                    'type_label' => $session->type->label(),
                    'status' => $session->status->value,
                    'status_label' => $session->status->label(),
                    'starts_at' => $session->starts_at?->format('Y-m-d\\TH:i'),
                    'ends_at' => $session->ends_at?->format('Y-m-d\\TH:i'),
                    'attendance_records_count' => $session->attendance_records_count,
                ])
                ->values(),
            'sessionTypes' => collect(SessionType::cases())->map(fn (SessionType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
            'sessionStatuses' => collect(SessionStatus::cases())->map(fn (SessionStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
            'participants' => $event->participants()
                ->search($search)
                ->orderBy('last_name')
                ->paginate(15)
                ->withQueryString(),
            'availableParticipants' => $request->user()?->isAdmin()
                ? Participant::query()
                    ->active()
                    ->whereDoesntHave('events', fn ($query) => $query->whereKey($event->id))
                    ->orderBy('last_name')
                    ->limit(50)
                    ->get(['id', 'registration_number', 'first_name', 'middle_name', 'last_name'])
                : [],
            'filters' => [
                'search' => $search,
            ],
            'can' => [
                'update' => $request->user()?->can('update', $event) ?? false,
                'delete' => $request->user()?->can('delete', $event) ?? false,
            ],
        ]);
    }

    public function edit(Event $event): Response
    {
        $this->authorize('update', $event);

        return Inertia::render('events/edit', [
            'event' => $event,
            'statuses' => $this->statusOptions(),
        ]);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        $options = [];

        foreach (EventStatus::cases() as $status) {
            $options[] = [
                'value' => $status->value,
                'label' => $status->label(),
            ];
        }

        return $options;
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $this->events->update($event, $request->validated());

        return to_route('events.show', $event)->with('success', 'Event updated.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        $this->authorize('delete', $event);

        try {
            $this->events->delete($event);
        } catch (InvalidArgumentException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return to_route('events.index')->with('success', 'Event deleted.');
    }
}

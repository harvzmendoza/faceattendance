<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantStatus;
use App\Http\Requests\StoreParticipantRequest;
use App\Http\Requests\UpdateParticipantRequest;
use App\Models\Participant;
use App\Services\ParticipantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ParticipantController extends Controller
{
    public function __construct(private ParticipantService $participants) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Participant::class);

        $search = $request->string('search')->toString();

        return Inertia::render('participants/index', [
            'participants' => Participant::query()
                ->search($search)
                ->withCount('events')
                ->latest()
                ->paginate(15)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
            'can' => [
                'create' => $request->user()?->can('create', Participant::class) ?? false,
                'import' => $request->user()?->can('import', Participant::class) ?? false,
                'export' => $request->user()?->can('export', Participant::class) ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Participant::class);

        return Inertia::render('participants/create', [
            'statuses' => $this->statusOptions(),
        ]);
    }

    public function store(StoreParticipantRequest $request): RedirectResponse
    {
        $participant = $this->participants->create(
            $request->safe()->except('photo'),
            $request->file('photo'),
        );

        return to_route('participants.show', $participant)->with('success', 'Participant created.');
    }

    public function show(Request $request, Participant $participant): Response
    {
        $this->authorize('view', $participant);

        $participant->load(['events:id,name,event_code,status', 'latestFaceProfile']);

        return Inertia::render('participants/show', [
            'participant' => $participant,
            'can' => [
                'update' => $request->user()?->can('update', $participant) ?? false,
                'delete' => $request->user()?->can('delete', $participant) ?? false,
                'enroll' => $request->user()?->can('enroll', $participant) ?? false,
            ],
        ]);
    }

    public function edit(Participant $participant): Response
    {
        $this->authorize('update', $participant);

        return Inertia::render('participants/edit', [
            'participant' => $participant,
            'statuses' => $this->statusOptions(),
        ]);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        $options = [];

        foreach (ParticipantStatus::cases() as $status) {
            $options[] = [
                'value' => $status->value,
                'label' => $status->label(),
            ];
        }

        return $options;
    }

    public function update(UpdateParticipantRequest $request, Participant $participant): RedirectResponse
    {
        $this->participants->update(
            $participant,
            $request->safe()->except('photo'),
            $request->file('photo'),
        );

        return to_route('participants.show', $participant)->with('success', 'Participant updated.');
    }

    public function destroy(Participant $participant): RedirectResponse
    {
        $this->authorize('delete', $participant);

        try {
            $this->participants->delete($participant);
        } catch (InvalidArgumentException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return to_route('participants.index')->with('success', 'Participant deleted.');
    }
}
